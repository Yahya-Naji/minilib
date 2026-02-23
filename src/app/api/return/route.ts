import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { checkoutId } = await request.json();

  if (!checkoutId) {
    return Response.json({ error: "Checkout ID is required" }, { status: 400 });
  }

  // Verify this checkout belongs to the user
  const { data: checkout, error: checkoutError } = await supabase
    .from("checkouts")
    .select("id, book_id, borrower_id, status")
    .eq("id", checkoutId)
    .single();

  if (checkoutError || !checkout) {
    return Response.json({ error: "Checkout not found" }, { status: 404 });
  }

  if (checkout.borrower_id !== user.id) {
    return Response.json({ error: "This checkout doesn't belong to you" }, { status: 403 });
  }

  if (checkout.status !== "active") {
    return Response.json({ error: "This book has already been returned" }, { status: 400 });
  }

  // Use admin client to bypass RLS
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: updateError } = await adminSupabase
    .from("checkouts")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
    })
    .eq("id", checkoutId);

  if (updateError) {
    console.error("Return error:", updateError);
    return Response.json({ error: "Failed to process return" }, { status: 500 });
  }

  await adminSupabase
    .from("books")
    .update({ status: "available" })
    .eq("id", checkout.book_id);

  return Response.json({ success: true, message: "Book returned successfully!" });
}
