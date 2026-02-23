"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Search } from "lucide-react";
import { GENRES } from "@/lib/constants";
import { toast } from "sonner";
import type { Book } from "@/types";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();
  const canManage = profile?.role === "admin" || profile?.role === "librarian";
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    const fetchBooks = async () => {
      try {
        setLoading(true);
        let query = supabase.from("books").select("*").order("created_at", { ascending: false });

        if (search) {
          query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
        }
        if (genre !== "all") {
          query = query.eq("genre", genre);
        }
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error } = await query;

        // Ignore stale responses
        if (currentFetchId !== fetchIdRef.current) return;

        if (error) {
          console.error("Books query error:", error);
          toast.error("Failed to load books");
          return;
        }

        setBooks(data || []);
      } catch (err) {
        console.error("Books fetch error:", err);
        if (currentFetchId === fetchIdRef.current) {
          toast.error("Failed to load books");
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchBooks();
  }, [search, genre, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete book");
      return;
    }

    toast.success("Book deleted");
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Books" description="Browse and manage the book collection.">
        {canManage && (
          <Button onClick={() => router.push("/books/new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add Book
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="borrowed">Borrowed</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description={
            search || genre !== "all" || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Start by adding your first book to the library."
          }
        >
          {canManage && !search && genre === "all" && statusFilter === "all" && (
            <Button onClick={() => router.push("/books/new")} className="gap-2">
              <Plus className="h-4 w-4" /> Add First Book
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
