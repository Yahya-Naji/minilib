"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { BookForm } from "@/components/books/book-form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Book } from "@/types";

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBook = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        toast.error("Book not found");
        router.push("/books");
        return;
      }

      setBook(data);
      setLoading(false);
    };

    fetchBook();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit Book" description={`Editing: ${book.title}`} />
      <BookForm book={book} />
    </div>
  );
}
