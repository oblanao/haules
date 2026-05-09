import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDb } from "../support/db";
import { newJar, withCookieJar, makeRequest } from "../support/http";

setupTestDb();

const jar = newJar();
beforeEach(() => { jar.clear(); withCookieJar(jar); });

async function register(email: string) {
  const { POST } = await import("@/app/api/auth/register/route");
  await POST(makeRequest("http://t/", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "longenoughpw1" }) }));
}

describe("threads API", () => {
  it("POST creates a thread; GET lists it; messages endpoint returns []", async () => {
    await register("t1@x.com");
    const { POST, GET } = await import("@/app/api/threads/route");
    const created = await (await POST()).json();
    expect(created.id).toBeTruthy();

    const list = await (await GET()).json();
    expect(list.threads).toHaveLength(1);
    expect(list.threads[0].id).toBe(created.id);

    const msgsMod = await import("@/app/api/threads/[threadId]/messages/route");
    const res = await msgsMod.GET(makeRequest("http://t/", {}), { params: Promise.resolve({ threadId: created.id }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toEqual([]);
  });
});
