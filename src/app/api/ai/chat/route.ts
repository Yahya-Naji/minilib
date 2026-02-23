import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
import { streamText, convertToModelMessages } from "ai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "member";
  const isAdmin = role === "admin" || role === "librarian";

  const { messages } = await request.json();

  // Get library stats for context
  const { count: totalBooks } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true });

  const { count: availableBooks } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");

  const adminContext = isAdmin
    ? `\n\nYou are talking to ${profile?.full_name || "an administrator"} who is a ${role}. They can:
- Add, edit, and remove books from the collection
- Manage checkouts and returns
- View all member activity and analytics
- Access library-wide data
Provide detailed operational insights and help with library management tasks.`
    : "";

  const memberContext = !isAdmin
    ? `\n\nYou are talking to ${profile?.full_name || "a member"} who is a library member. They can:
- Browse and search books
- Borrow and return books
- Rate and review books
- Get personalized recommendations
Help them find books they'll love and answer their questions about the library.`
    : "";

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful AI library assistant. You help users with:
- Finding books and making recommendations
- Understanding library policies (14-day borrowing period, renewals available)
- Answering questions about authors, genres, and literary topics
- Providing book summaries and reviews

Current library stats: ${totalBooks} total books, ${availableBooks} available.
Be friendly, knowledgeable, and concise.${adminContext}${memberContext}`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
