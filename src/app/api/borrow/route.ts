import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { bookId } = await request.json();

  if (!bookId) {
    return Response.json({ error: "Book ID is required" }, { status: 400 });
  }

  // Check book is available
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, title, status")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  if (book.status !== "available") {
    return Response.json({ error: "Book is not available for borrowing" }, { status: 400 });
  }

  // Check user doesn't already have too many active checkouts (limit 5)
  const { count } = await supabase
    .from("checkouts")
    .select("*", { count: "exact", head: true })
    .eq("borrower_id", user.id)
    .eq("status", "active");

  if (count && count >= 5) {
    return Response.json({ error: "You already have 5 books checked out. Return some first." }, { status: 400 });
  }

  // Use admin client for the actual checkout since RLS restricts member inserts
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create checkout
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error: checkoutError } = await adminSupabase.from("checkouts").insert({
    book_id: bookId,
    borrower_id: user.id,
    due_date: dueDate,
  });

  if (checkoutError) {
    console.error("Checkout error:", checkoutError);
    return Response.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  // Update book status
  const { error: updateError } = await adminSupabase
    .from("books")
    .update({ status: "borrowed" })
    .eq("id", bookId);

  if (updateError) {
    console.error("Book update error:", updateError);
  }

  return Response.json({
    success: true,
    message: `"${book.title}" borrowed successfully! Due back in 14 days.`,
    dueDate,
  });
}
