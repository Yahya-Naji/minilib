"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const suggestedQuestions = [
  "Recommend a good mystery novel",
  "What are the most popular genres?",
  "How long can I borrow a book?",
  "Tell me about classic literature",
];

function getMessageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col space-y-4">
      <PageHeader
        title="AI Library Assistant"
        description="Ask me anything about books, recommendations, or library services."
      />

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Library Assistant</h3>
              <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                I can help you find books, get recommendations, and answer questions about the library.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(q)}
                    className="text-xs"
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{getMessageText(message)}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{getMessageText(message)}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <CardContent className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about books..."
              className="min-h-[44px] resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
