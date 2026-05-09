import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db/client";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function AskIndex() {
  const user = (await getCurrentUser())!;
  const [latest] = await db.select({ id: schema.chatThreads.id }).from(schema.chatThreads)
    .where(eq(schema.chatThreads.userId, user.id))
    .orderBy(desc(schema.chatThreads.createdAt)).limit(1);
  if (latest) redirect(`/app/ask/${latest.id}`);

  const [t] = await db.insert(schema.chatThreads).values({ userId: user.id }).returning({ id: schema.chatThreads.id });
  redirect(`/app/ask/${t.id}`);
}
