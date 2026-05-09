import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, validateSession } from "./session";

export async function getCurrentUser() {
  const sid = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sid) return null;
  return validateSession(sid);
}
