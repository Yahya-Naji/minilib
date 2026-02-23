"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GENRES } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Book } from "@/types";

interface BookFormProps {
  book?: Book;
}

export function BookForm({ book }: BookFormProps) {
  const isEditing = !!book;
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    isbn: book?.isbn || "",
    genre: book?.genre || "",
    description: book?.description || "",
    cover_image_url: book?.cover_image_url || "",
    publication_year: book?.publication_year?.toString() || "",
    page_count: book?.page_count?.toString() || "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: form.title,
      author: form.author,
      isbn: form.isbn || null,
      genre: form.genre,
      description: form.description || null,
      cover_image_url: form.cover_image_url || null,
      publication_year: form.publication_year ? parseInt(form.publication_year) : null,
      page_count: form.page_count ? parseInt(form.page_count) : null,
      ...(isEditing ? {} : { added_by: profile?.id, status: "available" }),
    };

    if (isEditing) {
      const { error } = await supabase
        .from("books")
        .update(payload)
        .eq("id", book.id);

      if (error) {
        toast.error("Failed to update book");
        setLoading(false);
        return;
      }
      toast.success("Book updated successfully");
    } else {
      const { error } = await supabase.from("books").insert(payload);

      if (error) {
        toast.error("Failed to add book");
        setLoading(false);
        return;
      }
      toast.success("Book added successfully");
    }

    router.push("/books");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Book" : "Add New Book"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                placeholder="Book title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => handleChange("author", e.target.value)}
                required
                placeholder="Author name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={form.isbn}
                onChange={(e) => handleChange("isbn", e.target.value)}
                placeholder="978-..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select value={form.genre} onValueChange={(v) => handleChange("genre", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Publication Year</Label>
              <Input
                id="year"
                type="number"
                value={form.publication_year}
                onChange={(e) => handleChange("publication_year", e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pages">Page Count</Label>
              <Input
                id="pages"
                type="number"
                value={form.page_count}
                onChange={(e) => handleChange("page_count", e.target.value)}
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                value={form.cover_image_url}
                onChange={(e) => handleChange("cover_image_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the book..."
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Book" : "Add Book"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
