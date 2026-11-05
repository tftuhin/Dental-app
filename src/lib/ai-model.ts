import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

/**
 * The language model used by the AI features.
 * AI_PROVIDER = "anthropic" (default) | "openai" | "groq"; AI_MODEL overrides the model id.
 * Keys: ANTHROPIC_API_KEY, OPENAI_API_KEY or GROQ_API_KEY.
 */
export function getClinicalModel() {
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  if (provider === "openai") {
    return openai(process.env.AI_MODEL || "gpt-4o");
  }
  if (provider === "groq") {
    return groq(process.env.AI_MODEL || "openai/gpt-oss-120b");
  }
  return anthropic(process.env.AI_MODEL || "claude-sonnet-5-5");
}
