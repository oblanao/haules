import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/argon";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const Body = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(12).max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { email, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(schema.users).values({ email, passwordHash }).returning();
    await db.insert(schema.profiles).values({ userId: user.id });
    const sid = await createSession(user.id);
    (await cookies()).set(SESSION_COOKIE_NAME, sid, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60,
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code ?? (e as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    throw e;
  }
}
