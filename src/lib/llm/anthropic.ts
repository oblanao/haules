import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let cached: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!cached) cached = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
  return cached;
}

export const MODELS = {
  question: "claude-haiku-4-5-20251001",
  ask: "claude-sonnet-4-6",
} as const;

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const status = (e as { status?: number }).status ?? 0;
      if (status && status < 500 && status !== 429) throw e;
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  throw lastErr;
}
