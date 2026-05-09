import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const threads = await db.select({ id: schema.chatThreads.id, title: schema.chatThreads.title, createdAt: schema.chatThreads.createdAt })
    .from(schema.chatThreads).where(eq(schema.chatThreads.userId, user.id))
    .orderBy(desc(schema.chatThreads.createdAt));
  return NextResponse.json({ threads });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [t] = await db.insert(schema.chatThreads).values({ userId: user.id }).returning({ id: schema.chatThreads.id, title: schema.chatThreads.title });
  return NextResponse.json(t);
}
