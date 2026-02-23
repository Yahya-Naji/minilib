import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

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
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "member";
  const isAdmin = role === "admin" || role === "librarian";

  let body: { genre?: string; preferences?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  if (isAdmin) {
    // ADMIN: Analyze reading patterns across all users
    const { data: allHistory } = await supabase
      .from("reading_history")
      .select("*, book:books(title, author, genre), user:profiles!reading_history_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: checkouts } = await supabase
      .from("checkouts")
      .select("*, book:books(title, author, genre), borrower:profiles!checkouts_borrower_id_fkey(full_name)")
      .order("checked_out_at", { ascending: false })
      .limit(50);

    const { data: allBooks } = await supabase
      .from("books")
      .select("id, title, author, genre, status")
      .eq("status", "available");

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        insights: z.array(
          z.object({
            type: z.string().describe("Type of insight: trending_genre, popular_author, user_pattern, collection_gap"),
            title: z.string(),
            description: z.string(),
          })
        ),
        recommendations: z.array(
          z.object({
            bookId: z.string().nullable().describe("ID of a book from the library if applicable, or null"),
            title: z.string(),
            author: z.string(),
            reason: z.string().describe("Why this book should be added or promoted"),
            action: z.string().describe("Suggested action: promote, add_to_collection, feature_display"),
          })
        ),
      }),
      system: `You are a library analytics assistant helping administrators understand reading patterns and optimize the collection. Analyze the data and provide:
1. Key insights about reading trends, popular genres, active readers
2. Recommendations for books to add or promote based on patterns
Be data-driven and actionable.`,
      prompt: `Reading history (recent 100):\n${JSON.stringify(allHistory?.map((h: any) => ({
        user: h.user?.full_name || h.user?.email,
        book: h.book?.title,
        author: h.book?.author,
        genre: h.book?.genre,
        rating: h.rating,
      })))}\n\nRecent checkouts:\n${JSON.stringify(checkouts?.map((c: any) => ({
        borrower: c.borrower?.full_name,
        book: c.book?.title,
        genre: c.book?.genre,
      })))}\n\nAvailable books:\n${JSON.stringify(allBooks)}\n\nProvide 3-4 insights and 5 book recommendations.`,
    });

    return Response.json({ ...object, role });
  } else {
    // MEMBER: Personal recommendations based on preferences
    const { data: history } = await supabase
      .from("reading_history")
      .select("*, book:books(title, author, genre)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: allBooks } = await supabase
      .from("books")
      .select("id, title, author, genre, description")
      .eq("status", "available");

    const readBooks = history?.map((h: any) => ({
      title: h.book?.title,
      author: h.book?.author,
      genre: h.book?.genre,
      rating: h.rating,
    })) || [];

    const availableBooks = allBooks?.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre,
    })) || [];

    const preferences = body.preferences || body.genre || "";

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        recommendations: z.array(
          z.object({
            bookId: z.string().nullable().describe("ID of a book from the library if it matches, or null"),
            title: z.string(),
            author: z.string(),
            reason: z.string().describe("Why this book is recommended for this user"),
            inLibrary: z.boolean().describe("Whether this book is available in our library"),
          })
        ),
      }),
      system: `You are a friendly librarian recommending books to a library member. Based on their reading history, preferences, and available books in the library:
1. Prioritize books that are AVAILABLE in our library collection
2. If the user specified a genre or preferences, focus on those
3. Explain why each recommendation matches their taste
4. For each, clearly state whether the book is in our library`,
      prompt: `User's reading history:\n${JSON.stringify(readBooks)}\n\nUser preferences: ${preferences || "No specific preferences given"}\n\nAvailable books in library:\n${JSON.stringify(availableBooks)}\n\nRecommend 5 books, prioritizing ones from our library.`,
    });

    return Response.json({ ...object, role });
  }
}
