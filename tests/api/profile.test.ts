import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDb } from "../support/db";
import { newJar, withCookieJar, makeRequest } from "../support/http";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

setupTestDb();

const jar = newJar();

async function register(email: string) {
  withCookieJar(jar);
  const { POST } = await import("@/app/api/auth/register/route");
  const res = await POST(makeRequest("http://t/", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "longenoughpw1" }),
  }));
  if (!res.ok) throw new Error("register failed");
}

beforeEach(() => { jar.clear(); withCookieJar(jar); });

describe("GET /api/profile", () => {
  it("returns empty profile for new user", async () => {
    await register("p1@example.com");
    const { GET } = await import("@/app/api/profile/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.structured.partyComposition).toBeNull();
    expect(body.observations).toEqual([]);
  });

  it("401 when not authed", async () => {
    const { GET } = await import("@/app/api/profile/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/profile", () => {
  it("updates structured fields", async () => {
    await register("p2@example.com");
    const { PATCH, GET } = await import("@/app/api/profile/route");
    const res = await PATCH(makeRequest("http://t/", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ partyComposition: "couple", budgetPerDayUsd: 175 }),
    }));
    expect(res.status).toBe(200);
    const body = await (await GET()).json();
    expect(body.structured.partyComposition).toBe("couple");
    expect(body.structured.budgetPerDayUsd).toBe(175);
  });
});

describe("DELETE /api/profile", () => {
  it("resets profile and observations", async () => {
    await register("p3@example.com");
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, "p3@example.com"));
    await db.insert(schema.observations).values({ userId: user.id, note: "n", category: "preference" });
    const { DELETE, GET } = await import("@/app/api/profile/route");
    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await (await GET()).json();
    expect(body.observations).toEqual([]);
    expect(body.structured.partyComposition).toBeNull();
  });
});

describe("DELETE /api/profile/observations/:id", () => {
  it("removes one observation", async () => {
    await register("p4@example.com");
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, "p4@example.com"));
    const [obs] = await db.insert(schema.observations).values({ userId: user.id, note: "x", category: "memory" }).returning();
    const mod = await import("@/app/api/profile/observations/[id]/route");
    const res = await mod.DELETE(makeRequest(`http://t/${obs.id}`, { method: "DELETE" }), { params: Promise.resolve({ id: obs.id }) });
    expect(res.status).toBe(200);
    const all = await db.select().from(schema.observations);
    expect(all).toHaveLength(0);
  });
});
