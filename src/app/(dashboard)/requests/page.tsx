"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BookPlus, Check, X, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  requester?: { full_name: string | null; email: string };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function RequestsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("book_requests")
          .select("*, requester:profiles!book_requests_requested_by_fkey(full_name, email)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load requests:", error);
          toast.error("Failed to load requests");
          return;
        }

        setRequests((data as any) || []);
      } catch {
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("book_requests")
      .update({ status: action, handled_by: profile?.id })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update request");
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
    toast.success(`Request ${action}`);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book Requests"
        description={`Review book requests from members. ${pendingCount} pending.`}
      />

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No book requests"
          description="Members haven't requested any books yet."
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>All Requests ({requests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell>
                        {request.requester?.full_name || request.requester?.email || "Unknown"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {request.description || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${statusColors[request.status]}`}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-green-600"
                              onClick={() => handleAction(request.id, "approved")}
                            >
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-red-600"
                              onClick={() => handleAction(request.id, "rejected")}
                            >
                              <X className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
