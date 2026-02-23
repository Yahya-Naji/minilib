"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Loader2, Plus, BookOpen, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Book } from "@/types";

interface AdminSuggestion {
  title: string;
  author: string;
  genre: string;
  description: string;
  publicationYear: number | null;
  isbn: string | null;
  reason: string;
}

interface MemberSuggestions {
  type: "member_similar";
  similarBooks: Book[];
  message: string;
}

interface AdminSuggestions {
  type: "admin_add";
  items: AdminSuggestion[];
}

export default function AISearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [suggestions, setSuggestions] = useState<AdminSuggestions | MemberSuggestions | null>(null);
  const [addingBook, setAddingBook] = useState<string | null>(null);
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const isAdmin = profile?.role === "admin" || profile?.role === "librarian";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setInterpretation("");
    setSuggestions(null);

    try {
      const response = await fetch("/api/ai/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data.books);
      setInterpretation(data.interpretation);
      setSuggestions(data.suggestions);
    } catch {
      toast.error("AI search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (suggestion: AdminSuggestion) => {
    setAddingBook(suggestion.title);
    try {
      const { error } = await supabase.from("books").insert({
        title: suggestion.title,
        author: suggestion.author,
        genre: suggestion.genre,
        description: suggestion.description,
        publication_year: suggestion.publicationYear,
        isbn: suggestion.isbn,
        status: "available",
        added_by: profile?.id,
      });

      if (error) throw error;
      toast.success(`"${suggestion.title}" added to the library!`);
      // Remove from suggestions list
      if (suggestions?.type === "admin_add") {
        setSuggestions({
          ...suggestions,
          items: suggestions.items.filter((s) => s.title !== suggestion.title),
        });
      }
    } catch {
      toast.error("Failed to add book");
    } finally {
      setAddingBook(null);
    }
  };

  const [requesting, setRequesting] = useState(false);

  const handleRequestBook = async () => {
    if (!profile) return;
    setRequesting(true);
    try {
      const { error } = await supabase.from("book_requests").insert({
        requested_by: profile.id,
        title: query,
        description: `Search query: "${query}"${interpretation ? ` — AI interpretation: ${interpretation}` : ""}`,
      });

      if (error) {
        console.error("Request error:", error);
        toast.error("Failed to submit request. The feature may not be set up yet.");
        return;
      }
      toast.success("Book request submitted! The librarian will review it.");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Smart Search"
        description={
          isAdmin
            ? "Search the library — if a book isn't found, AI will suggest books to add to the collection."
            : "Search for books using natural language. If not found, we'll show similar books you might enjoy."
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe the kind of book you're looking for..."
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {interpretation && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                AI Interpretation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{interpretation}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {results.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Results</h2>
            <Badge variant="secondary">{results.length} books found</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Admin: Books to add from the internet */}
      {suggestions?.type === "admin_add" && suggestions.items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Not in Library — Add These?</h2>
            <p className="text-sm text-muted-foreground">
              These books match the search but aren't in your collection yet. Click to add them.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.items.map((suggestion, index) => (
              <motion.div
                key={suggestion.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{suggestion.author}</p>
                      </div>
                      <Badge variant="outline">{suggestion.genre}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <p className="text-xs italic text-muted-foreground">{suggestion.reason}</p>
                    {suggestion.isbn && (
                      <p className="text-xs text-muted-foreground">ISBN: {suggestion.isbn}</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleAddBook(suggestion)}
                      disabled={addingBook === suggestion.title}
                    >
                      {addingBook === suggestion.title ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add to Library
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Member: Similar books + request option */}
      {suggestions?.type === "member_similar" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm">{suggestions.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={handleRequestBook}
                    disabled={requesting}
                  >
                    {requesting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Request This Book
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {suggestions.similarBooks.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-semibold">Similar Books You Might Like</h2>
                <Badge variant="secondary">{suggestions.similarBooks.length} suggestions</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {suggestions.similarBooks.map((book, index) => (
                  <BookCard key={book.id} book={book} index={index} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!loading && results.length === 0 && !suggestions && interpretation && (
        <div className="py-12 text-center text-muted-foreground">
          No books matched your search. Try a different description.
        </div>
      )}
    </div>
  );
}
