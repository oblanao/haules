import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE_NAME)?.value;
  if (sid) await destroySession(sid);
  jar.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
