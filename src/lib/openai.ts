import { createOpenAI } from "@ai-sdk/openai";

const provider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use .chat() to force Chat Completions API instead of Responses API
export const openai = provider.chat;
