"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { motion } from "framer-motion";
import type { Book } from "@/types";

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700 border-green-200",
  borrowed: "bg-yellow-100 text-yellow-700 border-yellow-200",
  reserved: "bg-blue-100 text-blue-700 border-blue-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

interface BookCardProps {
  book: Book;
  index?: number;
  onDelete?: (id: string) => void;
}

export function BookCard({ book, index = 0, onDelete }: BookCardProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.role === "librarian";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-muted"
          onClick={() => router.push(`/books/${book.id}`)}
        >
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <Badge
            variant="outline"
            className={`absolute right-2 top-2 capitalize ${statusColors[book.status]}`}
          >
            {book.status}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1" onClick={() => router.push(`/books/${book.id}`)}>
              <h3 className="truncate font-semibold">{book.title}</h3>
              <p className="truncate text-sm text-muted-foreground">{book.author}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {book.genre}
                </Badge>
                {book.publication_year && (
                  <span className="text-xs text-muted-foreground">
                    {book.publication_year}
                  </span>
                )}
              </div>
            </div>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/books/${book.id}`)}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/books/${book.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  {profile?.role === "admin" && onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(book.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
