"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Search, Users, ArrowRight, Library } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "Book Management",
    description: "Add, edit, and organize your entire library collection with rich metadata.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Features",
    description: "Get smart recommendations, natural language search, and AI-generated summaries.",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find any book instantly with advanced filters or ask AI in plain English.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Admin, Librarian, and Member roles with tailored permissions.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Mini Library</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              Your Library,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Supercharged with AI
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Manage your book collection effortlessly with AI-powered recommendations,
              smart search, and automated summaries.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="border-t bg-muted/50 px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Features</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        Mini Library &copy; {new Date().getFullYear()}. Built with AI.
      </footer>
    </div>
  );
}
