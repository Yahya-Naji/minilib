"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowLeftRight, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  activeCheckouts: number;
  overdueCheckouts: number;
  totalMembers: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [booksRes, checkoutsRes, overdueRes, membersRes] = await Promise.all([
          supabase.from("books").select("status"),
          supabase.from("checkouts").select("id").eq("status", "active"),
          supabase.from("checkouts").select("id").eq("status", "overdue"),
          supabase.from("profiles").select("id"),
        ]);

        const books = booksRes.data || [];
        setStats({
          totalBooks: books.length,
          availableBooks: books.filter((b: any) => b.status === "available").length,
          activeCheckouts: checkoutsRes.data?.length || 0,
          overdueCheckouts: overdueRes.data?.length || 0,
          totalMembers: membersRes.data?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const isAdmin = profile?.role === "admin" || profile?.role === "librarian";

  const statCards = stats
    ? [
        {
          title: "Total Books",
          value: stats.totalBooks,
          subtitle: `${stats.availableBooks} available`,
          icon: BookOpen,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          title: "Active Checkouts",
          value: stats.activeCheckouts,
          subtitle: "Currently borrowed",
          icon: ArrowLeftRight,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          title: "Overdue",
          value: stats.overdueCheckouts,
          subtitle: "Need attention",
          icon: AlertTriangle,
          color: "text-red-600",
          bg: "bg-red-100",
        },
        ...(isAdmin
          ? [
              {
                title: "Members",
                value: stats.totalMembers,
                subtitle: "Registered users",
                icon: Users,
                color: "text-purple-600",
                bg: "bg-purple-100",
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "User"}`}
        description="Here's an overview of your library."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
