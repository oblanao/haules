import { describe, it, expect } from "vitest";
import { setupTestDb } from "../../support/db";
import { db, schema } from "@/lib/db/client";
import { createSession, validateSession, destroySession } from "@/lib/auth/session";

setupTestDb();

describe("session helpers", () => {
  it("creates, validates, and destroys a session", async () => {
    const [u] = await db.insert(schema.users).values({ email: "s@example.com", passwordHash: "x" }).returning();
    const sid = await createSession(u.id);
    const found = await validateSession(sid);
    expect(found?.id).toBe(u.id);
    await destroySession(sid);
    expect(await validateSession(sid)).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const [u] = await db.insert(schema.users).values({ email: "e@example.com", passwordHash: "x" }).returning();
    const [s] = await db.insert(schema.sessions).values({
      userId: u.id, expiresAt: new Date(Date.now() - 60_000),
    }).returning();
    expect(await validateSession(s.id)).toBeNull();
  });
});
