import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateProfile } from "@/lib/llm/build-loop";
import { AnswerPayloadSchema } from "@/lib/llm/question-schemas";

const Body = z.object({
  interactionId: z.string().uuid(),
  answer: AnswerPayloadSchema,
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const [row] = await db.select().from(schema.interactions).where(
    and(eq(schema.interactions.id, parsed.data.interactionId), eq(schema.interactions.userId, user.id))
  );
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.answeredAt) return NextResponse.json({ error: "already_answered" }, { status: 409 });

  await db.update(schema.interactions).set({ answerPayload: parsed.data.answer, answeredAt: new Date() })
    .where(eq(schema.interactions.id, row.id));

  if (!("skipped" in parsed.data.answer)) {
    await updateProfile(user.id, {
      questionText: row.questionText,
      questionType: row.questionType,
      questionPayload: row.questionPayload,
      answerPayload: parsed.data.answer,
    });
  }
  return NextResponse.json({ ok: true });
}
