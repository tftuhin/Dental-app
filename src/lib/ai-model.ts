import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

/**
 * The language model used by the AI features.
 * AI_PROVIDER = "anthropic" (default) | "openai"; AI_MODEL overrides the model id.
 */
export function getClinicalModel() {
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  if (provider === "openai") {
    return openai(process.env.AI_MODEL || "gpt-4o");
  }
  return anthropic(process.env.AI_MODEL || "claude-sonnet-5-5");
}
