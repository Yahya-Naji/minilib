"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", profile!.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your account settings." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant="secondary" className="capitalize">
                  {profile?.role}
                </Badge>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
