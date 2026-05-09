import { db, schema } from "@/lib/db/client";
import { and, asc, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ThreadList } from "@/components/chat/thread-list";
import { AskClient } from "@/components/chat/ask-client";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const user = (await getCurrentUser())!;
  const [thread] = await db.select().from(schema.chatThreads)
    .where(and(eq(schema.chatThreads.id, threadId), eq(schema.chatThreads.userId, user.id))).limit(1);
  if (!thread) notFound();

  const threads = await db.select({ id: schema.chatThreads.id, title: schema.chatThreads.title, createdAt: schema.chatThreads.createdAt })
    .from(schema.chatThreads).where(eq(schema.chatThreads.userId, user.id))
    .orderBy(desc(schema.chatThreads.createdAt));

  const messages = await db.select({ id: schema.chatMessages.id, role: schema.chatMessages.role, content: schema.chatMessages.content, citations: schema.chatMessages.citations })
    .from(schema.chatMessages).where(eq(schema.chatMessages.threadId, threadId))
    .orderBy(asc(schema.chatMessages.createdAt));

  type Citations = { fields: string[]; observation_ids: string[] } | null;

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6">
      <ThreadList threads={threads} activeId={threadId} />
      <AskClient threadId={threadId} initialMessages={messages.map((m) => ({ ...m, role: m.role as "user" | "assistant", citations: m.citations as Citations }))} />
    </div>
  );
}
