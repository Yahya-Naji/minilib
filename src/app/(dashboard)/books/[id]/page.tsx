"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  User,
  Sparkles,
  Loader2,
  BookMarked,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Book } from "@/types";

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  borrowed: "bg-yellow-100 text-yellow-700",
  reserved: "bg-blue-100 text-blue-700",
  lost: "bg-red-100 text-red-700",
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const supabase = createClient();
  const canManage = profile?.role === "admin" || profile?.role === "librarian";

  useEffect(() => {
    const fetchBook = async () => {
      try {
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
      } catch {
        toast.error("Failed to load book");
        router.push("/books");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    const { error } = await supabase.from("books").delete().eq("id", book!.id);
    if (error) {
      toast.error("Failed to delete book");
      return;
    }

    toast.success("Book deleted");
    router.push("/books");
  };

  const handleBorrow = async () => {
    if (!book || !profile) return;
    setBorrowing(true);

    try {
      const response = await fetch("/api/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to borrow book");
        return;
      }

      setBook({ ...book, status: "borrowed" });
      toast.success(data.message);
    } catch (err) {
      console.error("Borrow error:", err);
      toast.error("Failed to borrow book");
    } finally {
      setBorrowing(false);
    }
  };

  const generateSummary = async () => {
    if (!book) return;
    setGeneratingSummary(true);
    setSummary("");

    try {
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            setSummary((prev) => prev + decoder.decode(value));
          }
        }
      }
    } catch {
      toast.error("Failed to generate AI summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/books")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={book.title}>
          <div className="flex gap-2">
            {/* Member: Borrow button */}
            {!canManage && book.status === "available" && (
              <Button size="sm" onClick={handleBorrow} disabled={borrowing}>
                {borrowing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BookMarked className="mr-2 h-4 w-4" />
                )}
                Borrow Book
              </Button>
            )}
            {!canManage && book.status === "borrowed" && (
              <Badge variant="secondary" className="gap-1 py-1.5">
                <Check className="h-3 w-3" /> Currently Borrowed
              </Badge>
            )}
            {/* Admin/Librarian: Edit & Delete */}
            {canManage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/books/${book.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                {profile?.role === "admin" && (
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </PageHeader>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Badge className={`capitalize ${statusColors[book.status]}`}>{book.status}</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Author:</span>
              <span className="font-medium">{book.author}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Genre:</span>
              <span className="font-medium">{book.genre}</span>
            </div>
            {book.isbn && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">ISBN:</span>
                <span className="font-medium">{book.isbn}</span>
              </div>
            )}
            {book.publication_year && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Year:</span>
                <span className="font-medium">{book.publication_year}</span>
              </div>
            )}
            {book.page_count && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Pages:</span>
                <span className="font-medium">{book.page_count}</span>
              </div>
            )}
          </div>

          {book.description && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">Description</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {book.description}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Summary
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={generateSummary}
            disabled={generatingSummary}
          >
            {generatingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Summary
          </Button>
        </CardHeader>
        <CardContent>
          {summary ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              Click &quot;Generate Summary&quot; to get an AI-powered summary of this book.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
