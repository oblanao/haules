import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb } from "../support/db";
import { db, schema } from "@/lib/db/client";

setupTestDb();

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("enforceLimit", () => {
  it("counts up to the limit then refuses", async () => {
    vi.stubEnv("RATE_LIMIT_QUESTIONS_PER_DAY", "3");
    const [u] = await db
      .insert(schema.users)
      .values({ email: "rl@x", passwordHash: "x" })
      .returning();
    const { enforceLimit } = await import("@/lib/ratelimit");
    expect((await enforceLimit(u.id, "questions")).ok).toBe(true);
    expect((await enforceLimit(u.id, "questions")).ok).toBe(true);
    expect((await enforceLimit(u.id, "questions")).ok).toBe(true);
    const fourth = await enforceLimit(u.id, "questions");
    expect(fourth.ok).toBe(false);
  });
});
