"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, BookOpen, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { Book, Checkout, Profile } from "@/types";

export default function CheckoutPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [checkouts, setCheckouts] = useState<(Checkout & { book: Book; borrower: Profile })[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [checkoutsRes, booksRes, membersRes] = await Promise.all([
        supabase
          .from("checkouts")
          .select("*, book:books(*), borrower:profiles!checkouts_borrower_id_fkey(*)")
          .eq("status", "active")
          .order("checked_out_at", { ascending: false }),
        supabase.from("books").select("*").eq("status", "available"),
        supabase.from("profiles").select("*"),
      ]);

      setCheckouts((checkoutsRes.data as any) || []);
      setBooks(booksRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      console.error("Failed to load checkout data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedBook || !selectedMember) {
      toast.error("Please select a book and member");
      return;
    }

    setSubmitting(true);

    const { error: checkoutError } = await supabase.from("checkouts").insert({
      book_id: selectedBook,
      borrower_id: selectedMember,
      checked_out_by: profile?.id,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (checkoutError) {
      toast.error("Failed to checkout book");
      setSubmitting(false);
      return;
    }

    await supabase.from("books").update({ status: "borrowed" }).eq("id", selectedBook);

    toast.success("Book checked out successfully");
    setDialogOpen(false);
    setSelectedBook("");
    setSelectedMember("");
    setSubmitting(false);
    fetchData();
  };

  const handleReturn = async (checkout: Checkout) => {
    const { error } = await supabase
      .from("checkouts")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
        checked_in_by: profile?.id,
      })
      .eq("id", checkout.id);

    if (error) {
      toast.error("Failed to return book");
      return;
    }

    await supabase.from("books").update({ status: "available" }).eq("id", checkout.book_id);

    toast.success("Book returned successfully");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Check In / Check Out" description="Manage book borrowing and returns.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ArrowLeftRight className="h-4 w-4" /> New Checkout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Checkout a Book</DialogTitle>
              <DialogDescription>Select a book and member to process checkout.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Book</Label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select available book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title} — {book.author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCheckout} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process Checkout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : checkouts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No active checkouts"
          description="All books are currently available. Start a new checkout above."
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Active Checkouts</CardTitle>
              <CardDescription>{checkouts.length} books currently borrowed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Checked Out</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkouts.map((checkout) => {
                    const isOverdue = new Date(checkout.due_date) < new Date();
                    return (
                      <TableRow key={checkout.id}>
                        <TableCell className="font-medium">
                          {checkout.book?.title || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {checkout.borrower?.full_name || checkout.borrower?.email || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(checkout.checked_out_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(checkout.due_date), "MMM d, yyyy")}
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
                            onClick={() => handleReturn(checkout)}
                          >
                            <Undo2 className="mr-2 h-3 w-3" /> Return
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
    </div>
  );
}
