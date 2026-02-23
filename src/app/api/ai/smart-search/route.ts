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

  const { query } = await request.json();

  // Step 1: Parse the query into structured filters
  const { object: filters } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      title: z.string().nullable().describe("Title keyword to search for, or null if not specified"),
      author: z.string().nullable().describe("Author name to search for, or null if not specified"),
      genre: z.string().nullable().describe("Genre category, or null if not specified"),
      yearMin: z.number().nullable().describe("Minimum publication year, or null if not specified"),
      yearMax: z.number().nullable().describe("Maximum publication year, or null if not specified"),
      interpretation: z.string().describe("Brief explanation of how you interpreted the query"),
    }),
    system:
      "You are a search query interpreter for a library system. Extract structured filters from natural language queries about books. Set fields to null if they are not clearly implied by the query.",
    prompt: `Interpret this search query: "${query}"`,
  });

  // Step 2: Search library database
  let dbQuery = supabase.from("books").select("*");

  if (filters.title) {
    dbQuery = dbQuery.ilike("title", `%${filters.title}%`);
  }
  if (filters.author) {
    dbQuery = dbQuery.ilike("author", `%${filters.author}%`);
  }
  if (filters.genre) {
    dbQuery = dbQuery.ilike("genre", `%${filters.genre}%`);
  }
  if (filters.yearMin) {
    dbQuery = dbQuery.gte("publication_year", filters.yearMin);
  }
  if (filters.yearMax) {
    dbQuery = dbQuery.lte("publication_year", filters.yearMax);
  }

  const { data: books } = await dbQuery.limit(20);
  const foundBooks = books || [];

  // Step 3: If no results, generate AI suggestions based on role
  let suggestions = null;
  if (foundBooks.length === 0) {
    if (isAdmin) {
      // Admin: suggest books from the internet that could be added to library
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          suggestions: z.array(
            z.object({
              title: z.string(),
              author: z.string(),
              genre: z.string(),
              description: z.string().describe("Brief description of the book"),
              publicationYear: z.number().nullable(),
              isbn: z.string().nullable(),
              reason: z.string().describe("Why this book matches the search"),
            })
          ),
        }),
        system:
          "You are a knowledgeable librarian. The search returned no results from the library. Suggest 5 real books that match the query that could be added to the library collection. Provide accurate information including ISBNs when possible.",
        prompt: `The user searched for: "${query}" (interpreted as: ${filters.interpretation}). No books matched in our library. Suggest 5 real books from the wider world that match this search.`,
      });
      suggestions = { type: "admin_add" as const, items: object.suggestions };
    } else {
      // Member: suggest similar books from library + allow requesting
      const { data: allBooks } = await supabase
        .from("books")
        .select("id, title, author, genre, description")
        .limit(50);

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          similarBookIds: z.array(z.string()).describe("IDs of similar books from the library that the user might like"),
          message: z.string().describe("Friendly message explaining what was found and suggesting alternatives"),
        }),
        system:
          "You are a helpful library assistant. The user's search returned no direct matches. Look at the available library books and suggest the most similar ones. Return up to 5 book IDs that are closest to what the user is looking for.",
        prompt: `User searched for: "${query}" (interpreted as: ${filters.interpretation}). No direct matches found. Here are all available books:\n${JSON.stringify(allBooks)}\n\nSuggest the most similar books from this collection.`,
      });

      // Fetch full book data for similar books
      const { data: similarBooks } = await supabase
        .from("books")
        .select("*")
        .in("id", object.similarBookIds);

      suggestions = {
        type: "member_similar" as const,
        similarBooks: similarBooks || [],
        message: object.message,
      };
    }
  }

  return Response.json({
    interpretation: filters.interpretation,
    filters,
    books: foundBooks,
    suggestions,
    role,
  });
}
