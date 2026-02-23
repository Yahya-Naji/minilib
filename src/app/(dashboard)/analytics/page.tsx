"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface AnalyticsData {
  genreBreakdown: { genre: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  totalBooks: number;
  totalCheckouts: number;
  totalMembers: number;
  recentCheckouts: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [booksRes, checkoutsRes, membersRes, recentRes] = await Promise.all([
          supabase.from("books").select("genre, status"),
          supabase.from("checkouts").select("id"),
          supabase.from("profiles").select("id"),
          supabase
            .from("checkouts")
            .select("id")
            .gte("checked_out_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        ]);

        const books = booksRes.data || [];

        const genreMap = new Map<string, number>();
        const statusMap = new Map<string, number>();
        books.forEach((b: any) => {
          genreMap.set(b.genre, (genreMap.get(b.genre) || 0) + 1);
          statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1);
        });

        setData({
          genreBreakdown: Array.from(genreMap.entries())
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count),
          statusBreakdown: Array.from(statusMap.entries()).map(([status, count]) => ({
            status,
            count,
          })),
          totalBooks: books.length,
          totalCheckouts: checkoutsRes.data?.length || 0,
          totalMembers: membersRes.data?.length || 0,
          recentCheckouts: recentRes.data?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statusColors: Record<string, string> = {
    available: "bg-green-500",
    borrowed: "bg-yellow-500",
    reserved: "bg-blue-500",
    lost: "bg-red-500",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Library statistics and insights." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Books", value: data.totalBooks },
          { label: "Total Checkouts", value: data.totalCheckouts },
          { label: "Members", value: data.totalMembers },
          { label: "Checkouts (30d)", value: data.recentCheckouts },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Books by Genre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.genreBreakdown.slice(0, 8).map((item) => (
                <div key={item.genre} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted-foreground">{item.genre}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(item.count / data.totalBooks) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.statusBreakdown.map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${statusColors[item.status] || "bg-gray-500"}`}
                  />
                  <span className="w-24 text-sm capitalize text-muted-foreground">
                    {item.status}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(item.count / data.totalBooks) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
