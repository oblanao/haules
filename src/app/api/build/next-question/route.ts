import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { askNextQuestion } from "@/lib/llm/build-loop";
import { enforceLimit } from "@/lib/ratelimit";

function questionText(p: { type: string } & Record<string, unknown>): string {
  if (p.type === "true_false") return p.statement as string;
  return (p.prompt as string) ?? "";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = await enforceLimit(user.id, "questions");
  if (!limit.ok) return NextResponse.json({ error: "rate_limited", message: limit.message }, { status: 429 });

  const payload = await askNextQuestion(user.id);
  const [row] = await db.insert(schema.interactions).values({
    userId: user.id,
    questionText: questionText(payload as { type: string } & Record<string, unknown>),
    questionType: payload.type,
    questionPayload: payload,
  }).returning({ id: schema.interactions.id });
  return NextResponse.json({ interactionId: row.id, payload });
}
