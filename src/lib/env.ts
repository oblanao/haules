import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL_QUESTION: z.string().min(1).default("anthropic/claude-haiku-4.5"),
  OPENROUTER_MODEL_ASK: z.string().min(1).default("anthropic/claude-sonnet-4.6"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  RATE_LIMIT_QUESTIONS_PER_DAY: z.coerce.number().int().positive().default(200),
  RATE_LIMIT_CHAT_MESSAGES_PER_DAY: z.coerce.number().int().positive().default(100),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
