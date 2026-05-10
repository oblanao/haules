import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/argon";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { env } from "@/lib/env";

const Body = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { email, password } = parsed.data;

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  const sid = await createSession(user.id);
  (await cookies()).set(SESSION_COOKIE_NAME, sid, {
    httpOnly: true, secure: env().COOKIE_SECURE,
    sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60,
  });
  return NextResponse.json({ ok: true });
}
