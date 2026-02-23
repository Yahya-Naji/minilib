"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, BookOpen, Loader2, TrendingUp, BarChart3, Library, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { GENRES } from "@/lib/constants";

interface MemberRecommendation {
  bookId?: string | null;
  title: string;
  author: string;
  reason: string;
  inLibrary: boolean;
}

interface AdminInsight {
  type: string;
  title: string;
  description: string;
}

interface AdminRecommendation {
  bookId?: string | null;
  title: string;
  author: string;
  reason: string;
  action: string;
}

export default function AIRecommendationsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.role === "admin" || profile?.role === "librarian";

  // Member state
  const [genre, setGenre] = useState("");
  const [preferences, setPreferences] = useState("");
  const [memberRecs, setMemberRecs] = useState<MemberRecommendation[]>([]);

  // Admin state
  const [insights, setInsights] = useState<AdminInsight[]>([]);
  const [adminRecs, setAdminRecs] = useState<AdminRecommendation[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: genre || undefined,
          preferences: preferences || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed");

      const data = await response.json();

      if (isAdmin) {
        setInsights(data.insights || []);
        setAdminRecs(data.recommendations || []);
      } else {
        setMemberRecs(data.recommendations || []);
      }
    } catch {
      toast.error("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const insightIcons: Record<string, typeof TrendingUp> = {
    trending_genre: TrendingUp,
    popular_author: BookOpen,
    user_pattern: BarChart3,
    collection_gap: Library,
  };

  const actionColors: Record<string, string> = {
    promote: "bg-green-100 text-green-700",
    add_to_collection: "bg-blue-100 text-blue-700",
    feature_display: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "AI Library Analytics" : "AI Recommendations"}
        description={
          isAdmin
            ? "Analyze reading patterns across all users and get data-driven collection recommendations."
            : "Get personalized book recommendations based on your preferences and reading history."
        }
      >
        <Button onClick={fetchRecommendations} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isAdmin ? "Analyze Patterns" : "Get Recommendations"}
        </Button>
      </PageHeader>

      {/* Member: Preferences input */}
      {!isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Genre</SelectItem>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Tell us what you like (e.g., 'thrilling adventures with strong characters')"
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <Skeleton className="mt-4 h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isAdmin ? (
        <>
          {/* Admin: Insights */}
          {insights.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Reading Insights</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {insights.map((insight, index) => {
                  const Icon = insightIcons[insight.type] || TrendingUp;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4 text-primary" />
                            {insight.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin: Collection Recommendations */}
          {adminRecs.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Collection Recommendations</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {adminRecs.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">{rec.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{rec.author}</p>
                          </div>
                          <Badge className={actionColors[rec.action] || "bg-gray-100 text-gray-700"}>
                            {rec.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {insights.length === 0 && adminRecs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-center text-muted-foreground">
                  Click &quot;Analyze Patterns&quot; to see reading trends and collection recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Member: Personal Recommendations */}
          {memberRecs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memberRecs.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{rec.title}</CardTitle>
                            {rec.inLibrary && (
                              <Badge variant="secondary" className="shrink-0 gap-1">
                                <CheckCircle className="h-3 w-3" /> In Library
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.author}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      {rec.inLibrary && rec.bookId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => router.push(`/books/${rec.bookId}`)}
                        >
                          View Book
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-center text-muted-foreground">
                  Select a genre or describe your preferences, then click &quot;Get Recommendations&quot; for personalized suggestions.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
