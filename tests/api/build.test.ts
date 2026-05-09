import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupTestDb } from "../support/db";
import { newJar, withCookieJar, makeRequest } from "../support/http";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

setupTestDb();

const jar = newJar();
beforeEach(() => { jar.clear(); withCookieJar(jar); vi.resetModules(); });

vi.mock("@/lib/llm/build-loop", () => ({
  askNextQuestion: vi.fn().mockResolvedValue({ type: "true_false", statement: "I love nature" }),
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

async function register(email: string) {
  const { POST } = await import("@/app/api/auth/register/route");
  await POST(makeRequest("http://t/", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "longenoughpw1" }) }));
}

describe("GET /api/build/next-question", () => {
  it("returns a question and persists an interaction row", async () => {
    await register("b1@example.com");
    const { GET } = await import("@/app/api/build/next-question/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.payload.type).toBe("true_false");
    expect(body.interactionId).toMatch(/^[0-9a-f-]{36}$/);
    const rows = await db.select().from(schema.interactions);
    expect(rows).toHaveLength(1);
    expect(rows[0].questionType).toBe("true_false");
    expect(rows[0].answerPayload).toBeNull();
  });
});

describe("POST /api/build/answer", () => {
  it("records the answer and triggers an update", async () => {
    await register("b2@example.com");
    const next = await import("@/app/api/build/next-question/route");
    const r1 = await next.GET();
    const { interactionId } = await r1.json();

    const { POST } = await import("@/app/api/build/answer/route");
    const res = await POST(makeRequest("http://t/", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ interactionId, answer: { type: "true_false", value: true } }),
    }));
    expect(res.status).toBe(200);
    const updated = await db.select().from(schema.interactions).where(eq(schema.interactions.id, interactionId));
    expect(updated[0].answerPayload).toEqual({ type: "true_false", value: true });
    expect(updated[0].answeredAt).toBeTruthy();
  });

  it("rejects answer for an interaction belonging to someone else with 404", async () => {
    await register("b3@example.com");
    const next = await import("@/app/api/build/next-question/route");
    const r1 = await next.GET();
    const { interactionId } = await r1.json();

    jar.clear(); withCookieJar(jar);
    await register("b4@example.com");

    const { POST } = await import("@/app/api/build/answer/route");
    const res = await POST(makeRequest("http://t/", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ interactionId, answer: { type: "true_false", value: true } }),
    }));
    expect(res.status).toBe(404);
  });
});
