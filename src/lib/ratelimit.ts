import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { env } from "@/lib/env";

type Bucket = "questions" | "chat";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function limitFor(bucket: Bucket): number {
  return bucket === "questions"
    ? env().RATE_LIMIT_QUESTIONS_PER_DAY
    : env().RATE_LIMIT_CHAT_MESSAGES_PER_DAY;
}

export async function enforceLimit(
  userId: string,
  bucket: Bucket
): Promise<{ ok: boolean; message?: string }> {
  const day = todayUtc();
  const limit = limitFor(bucket);

  await db
    .insert(schema.ratelimitCounters)
    .values({ userId, bucket, day, count: 1 })
    .onConflictDoUpdate({
      target: [
        schema.ratelimitCounters.userId,
        schema.ratelimitCounters.bucket,
        schema.ratelimitCounters.day,
      ],
      set: { count: sql`${schema.ratelimitCounters.count} + 1` },
    });

  const [row] = await db
    .select({ count: schema.ratelimitCounters.count })
    .from(schema.ratelimitCounters)
    .where(
      and(
        eq(schema.ratelimitCounters.userId, userId),
        eq(schema.ratelimitCounters.bucket, bucket),
        eq(schema.ratelimitCounters.day, day)
      )
    );

  if ((row?.count ?? 0) > limit) {
    return {
      ok: false,
      message: `Daily limit of ${limit} ${bucket} reached. Try again tomorrow.`,
    };
  }
  return { ok: true };
}
