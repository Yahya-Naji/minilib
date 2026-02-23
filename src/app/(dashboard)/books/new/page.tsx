"use client";

import { PageHeader } from "@/components/shared/page-header";
import { BookForm } from "@/components/books/book-form";

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add New Book" description="Add a new book to the library collection." />
      <BookForm />
    </div>
  );
}
