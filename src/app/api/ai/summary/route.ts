import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
import { streamText } from "ai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { bookId } = await request.json();

  const { data: book } = await supabase
    .from("books")
    .select("title, author, genre, description, publication_year, page_count")
    .eq("id", bookId)
    .single();

  if (!book) {
    return new Response("Book not found", { status: 404 });
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a knowledgeable librarian. Generate an engaging, concise summary of the book based on the available information. If you know the book, provide insights about its themes, writing style, and why readers enjoy it. Keep it to 2-3 paragraphs.",
    prompt: `Generate a summary for: "${book.title}" by ${book.author}. Genre: ${book.genre}. ${book.description ? `Description: ${book.description}` : ""} ${book.publication_year ? `Published: ${book.publication_year}` : ""} ${book.page_count ? `Pages: ${book.page_count}` : ""}`,
  });

  return result.toTextStreamResponse();
}
