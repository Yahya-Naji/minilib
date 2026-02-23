"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import {
  BookOpen,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Sparkles,
  Search,
  MessageSquare,
  BarChart3,
  Settings,
  Library,
  Inbox,
  BookMarked,
} from "lucide-react";
import { motion } from "framer-motion";

const getNavItems = (role: string) => {
  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "librarian", "member"],
    },
    {
      title: "Books",
      href: "/books",
      icon: BookOpen,
      roles: ["admin", "librarian", "member"],
    },
    {
      title: "My Books",
      href: "/my-books",
      icon: BookMarked,
      roles: ["member"],
    },
    {
      title: "Check In/Out",
      href: "/checkout",
      icon: ArrowLeftRight,
      roles: ["admin", "librarian"],
    },
    {
      title: "Members",
      href: "/members",
      icon: Users,
      roles: ["admin"],
    },
    {
      title: "Book Requests",
      href: "/requests",
      icon: Inbox,
      roles: ["admin", "librarian"],
    },
    { type: "separator" as const, title: "AI Features", roles: ["admin", "librarian", "member"] },
    {
      title: "AI Recommendations",
      href: "/ai/recommendations",
      icon: Sparkles,
      roles: ["admin", "librarian", "member"],
    },
    {
      title: "AI Search",
      href: "/ai/search",
      icon: Search,
      roles: ["admin", "librarian", "member"],
    },
    {
      title: "AI Assistant",
      href: "/ai/assistant",
      icon: MessageSquare,
      roles: ["admin", "librarian", "member"],
    },
    { type: "separator" as const, title: "Admin", roles: ["admin"] },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin", "librarian", "member"],
    },
  ];

  return items.filter((item) => item.roles?.includes(role));
};

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const navItems = getNavItems(profile?.role || "member");

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Library className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Mini Library</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item, index) => {
          if ("type" in item && item.type === "separator") {
            return (
              <div key={index} className="pb-1 pt-4">
                <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.title}
                </p>
              </div>
            );
          }

          if (!("href" in item)) return null;

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon!;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
