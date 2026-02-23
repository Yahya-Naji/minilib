"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { Profile } from "@/types";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  librarian: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-700",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load members");
        setLoading(false);
        return;
      }

      setMembers(data || []);
      setLoading(false);
    };

    fetchMembers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update role");
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newRole as Profile["role"] } : m))
    );
    toast.success("Role updated");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Members" description="Manage library members and their roles." />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card>
          <CardHeader>
            <CardTitle>All Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || ""} />
                            <AvatarFallback>
                              {member.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {member.full_name || "Unnamed"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${roleColors[member.role]}`}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(v) => updateRole(member.id, v)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="librarian">Librarian</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
