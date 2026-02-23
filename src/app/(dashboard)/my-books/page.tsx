"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Undo2, Loader2, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { Book, Checkout } from "@/types";

export default function MyBooksPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [checkouts, setCheckouts] = useState<(Checkout & { book: Book })[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        setLoading(true);
        if (!profile?.id) return;

        const { data, error } = await supabase
          .from("checkouts")
          .select("*, book:books(*)")
          .eq("borrower_id", profile.id)
          .order("checked_out_at", { ascending: false });

        if (error) {
          console.error("Failed to load checkouts:", error);
          return;
        }

        setCheckouts((data as any) || []);
      } catch {
        toast.error("Failed to load your books");
      } finally {
        setLoading(false);
      }
    };

    fetchMyBooks();
  }, [profile?.id]);

  const handleReturn = async (checkoutId: string) => {
    setReturningId(checkoutId);
    try {
      const response = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to return book");
        return;
      }

      setCheckouts((prev) =>
        prev.map((c) =>
          c.id === checkoutId
            ? { ...c, status: "returned" as const, returned_at: new Date().toISOString() }
            : c
        )
      );
      toast.success(data.message);
    } catch {
      toast.error("Failed to return book");
    } finally {
      setReturningId(null);
    }
  };

  const activeCheckouts = checkouts.filter((c) => c.status === "active");
  const pastCheckouts = checkouts.filter((c) => c.status === "returned");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Books"
        description="View your borrowed books and return them when you're done."
      />

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : checkouts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No borrowed books"
          description="You haven't borrowed any books yet. Browse the library to find something to read!"
        >
          <Button onClick={() => router.push("/books")}>Browse Books</Button>
        </EmptyState>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />
              Borrowed ({activeCheckouts.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              History ({pastCheckouts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeCheckouts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No books currently borrowed.</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Borrowed</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeCheckouts.map((checkout) => {
                          const isOverdue = new Date(checkout.due_date) < new Date();
                          return (
                            <TableRow key={checkout.id}>
                              <TableCell>
                                <div
                                  className="flex items-center gap-3 cursor-pointer hover:underline"
                                  onClick={() => router.push(`/books/${checkout.book_id}`)}
                                >
                                  {checkout.book?.cover_image_url ? (
                                    <img
                                      src={checkout.book.cover_image_url}
                                      alt={checkout.book?.title}
                                      className="h-12 w-9 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-9 items-center justify-center rounded bg-muted">
                                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">{checkout.book?.title || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">{checkout.book?.author}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(checkout.checked_out_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-sm">
                                <span className={isOverdue ? "font-medium text-red-600" : "text-muted-foreground"}>
                                  {format(new Date(checkout.due_date), "MMM d, yyyy")}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={isOverdue ? "destructive" : "secondary"}>
                                  {isOverdue ? "Overdue" : "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReturn(checkout.id)}
                                  disabled={returningId === checkout.id}
                                >
                                  {returningId === checkout.id ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Undo2 className="mr-2 h-3 w-3" />
                                  )}
                                  Return
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {pastCheckouts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No return history yet.</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Borrowed</TableHead>
                          <TableHead>Returned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastCheckouts.map((checkout) => (
                          <TableRow key={checkout.id}>
                            <TableCell>
                              <div
                                className="flex items-center gap-3 cursor-pointer hover:underline"
                                onClick={() => router.push(`/books/${checkout.book_id}`)}
                              >
                                {checkout.book?.cover_image_url ? (
                                  <img
                                    src={checkout.book.cover_image_url}
                                    alt={checkout.book?.title}
                                    className="h-12 w-9 rounded object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-9 items-center justify-center rounded bg-muted">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{checkout.book?.title || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{checkout.book?.author}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(checkout.checked_out_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {checkout.returned_at
                                ? format(new Date(checkout.returned_at), "MMM d, yyyy")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
