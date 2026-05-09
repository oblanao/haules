import OpenAI from "openai";
import { env } from "@/lib/env";

let cached: OpenAI | null = null;
export function openrouter(): OpenAI {
  if (!cached) {
    cached = new OpenAI({
      apiKey: env().OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/oblanao/haules",
        "X-Title": "Haules",
      },
    });
  }
  return cached;
}

export function modelForQuestion(): string { return env().OPENROUTER_MODEL_QUESTION; }
export function modelForAsk(): string { return env().OPENROUTER_MODEL_ASK; }

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
