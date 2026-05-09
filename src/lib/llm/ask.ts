import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { anthropic, MODELS } from "./anthropic";
import { renderProfile } from "./profile-render";

const SYSTEM = `You are Haules, a thoughtful travel concierge. You answer the user's questions using their travel profile (provided below) to make answers feel personally tailored.

Always end your response with a fenced JSON block listing what you cited from the profile, in this exact format:

\`\`\`citations
{"fields":["field_name", ...],"observation_ids":["id", ...]}
\`\`\`

Use empty arrays if you didn't cite anything. Do not include any text after the citations block.`;

export async function loadAskContext(userId: string, threadId: string) {
  const [structured] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const observations = await db.select({ id: schema.observations.id, note: schema.observations.note, category: schema.observations.category })
    .from(schema.observations).where(eq(schema.observations.userId, userId)).orderBy(desc(schema.observations.createdAt));
  const messages = await db.select({ role: schema.chatMessages.role, content: schema.chatMessages.content })
    .from(schema.chatMessages).where(eq(schema.chatMessages.threadId, threadId))
    .orderBy(asc(schema.chatMessages.createdAt))
    .limit(20);
  return { profile: { structured, observations }, messages };
}

export async function ensureThreadOwned(userId: string, threadId: string) {
  const [t] = await db.select().from(schema.chatThreads)
    .where(and(eq(schema.chatThreads.id, threadId), eq(schema.chatThreads.userId, userId))).limit(1);
  return !!t;
}

export function buildSystemBlock(profileText: string) {
  return [
    { type: "text" as const, text: SYSTEM, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: profileText },
  ];
}

export function streamAsk(systemBlocks: ReturnType<typeof buildSystemBlock>, history: { role: "user" | "assistant"; content: string }[], userMessage: string) {
  return anthropic().messages.stream({
    model: MODELS.ask,
    max_tokens: 1500,
    system: systemBlocks,
    messages: [...history, { role: "user", content: userMessage }],
  });
}
