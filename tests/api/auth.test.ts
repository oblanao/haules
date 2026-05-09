import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupTestDb } from "../support/db";
import { newJar, withCookieJar, makeRequest } from "../support/http";

setupTestDb();

const jar = newJar();
beforeEach(() => { jar.clear(); withCookieJar(jar); });

describe("POST /api/auth/register", () => {
  it("creates a user, profile, and session cookie", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(makeRequest("http://t/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "new@example.com", password: "hunter22hunter22" }),
    }));
    expect(res.status).toBe(200);
    expect(jar.has("haules_session")).toBe(true);
  });

  it("rejects short passwords", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(makeRequest("http://t/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "x@example.com", password: "short" }),
    }));
    expect(res.status).toBe(400);
  });

  it("rejects duplicate email with 409", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const make = () => POST(makeRequest("http://t/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "dup@example.com", password: "longenoughpw1" }),
    }));
    expect((await make()).status).toBe(200);
    expect((await make()).status).toBe(409);
  });
});

// next/headers mock is provided by tests/support/http.ts (module-level vi.mock)

describe("POST /api/auth/login", () => {
  it("issues a session for correct credentials", async () => {
    const reg = await import("@/app/api/auth/register/route");
    await reg.POST(makeRequest("http://t/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "li@example.com", password: "longenoughpw1" }),
    }));
    jar.delete("haules_session");

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest("http://t/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "li@example.com", password: "longenoughpw1" }),
    }));
    expect(res.status).toBe(200);
    expect(jar.has("haules_session")).toBe(true);
  });

  it("rejects bad password with 401", async () => {
    const reg = await import("@/app/api/auth/register/route");
    await reg.POST(makeRequest("http://t/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wp@example.com", password: "longenoughpw1" }),
    }));
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest("http://t/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wp@example.com", password: "wrong-password!" }),
    }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("destroys the session cookie", async () => {
    const reg = await import("@/app/api/auth/register/route");
    await reg.POST(makeRequest("http://t/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "lo@example.com", password: "longenoughpw1" }),
    }));
    expect(jar.has("haules_session")).toBe(true);

    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST(makeRequest("http://t/api/auth/logout", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(jar.has("haules_session")).toBe(false);
  });
});
