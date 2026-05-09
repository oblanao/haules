import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(_req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { threadId } = await ctx.params;
  const [thread] = await db.select().from(schema.chatThreads).where(and(eq(schema.chatThreads.id, threadId), eq(schema.chatThreads.userId, user.id))).limit(1);
  if (!thread) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const messages = await db.select({ id: schema.chatMessages.id, role: schema.chatMessages.role, content: schema.chatMessages.content, citations: schema.chatMessages.citations, createdAt: schema.chatMessages.createdAt })
    .from(schema.chatMessages).where(eq(schema.chatMessages.threadId, threadId)).orderBy(asc(schema.chatMessages.createdAt));
  return NextResponse.json({ messages });
}
