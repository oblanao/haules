import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = "haules_session";

export async function createSession(userId: string): Promise<string> {
  const [s] = await db.insert(schema.sessions).values({
    userId,
    expiresAt: new Date(Date.now() + ONE_MONTH_MS),
  }).returning({ id: schema.sessions.id });
  return s.id;
}

export async function validateSession(sessionId: string): Promise<{ id: string; email: string } | null> {
  const rows = await db
    .select({ uid: schema.users.id, email: schema.users.email, expiresAt: schema.sessions.expiresAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
    return null;
  }
  return { id: row.uid, email: row.email };
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
}
