import { vi } from "vitest";

type CookieJar = Map<string, string>;

// Module-level mutable reference so the vi.mock factory (which is hoisted) can
// read the current jar at call-time rather than capture-time.
let _activeJar: CookieJar | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (_activeJar?.has(n) ? { name: n, value: _activeJar.get(n) } : undefined),
    set: (n: string, v: string) => { _activeJar?.set(n, v); },
    delete: (n: string) => { _activeJar?.delete(n); },
  }),
}));

export function makeRequest(url: string, init: RequestInit = {}, jar?: CookieJar): Request {
  const headers = new Headers(init.headers);
  if (jar && jar.size > 0) {
    headers.set("cookie", [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "));
  }
  return new Request(url, { ...init, headers });
}

export function readSetCookie(res: Response): { name: string; value: string } | null {
  const header = res.headers.get("set-cookie");
  if (!header) return null;
  const [pair] = header.split(";");
  const [name, value] = pair.split("=");
  return { name: name.trim(), value: value.trim() };
}

export function newJar(): CookieJar {
  return new Map();
}

export function setCookie(jar: CookieJar, name: string, value: string) {
  jar.set(name, value);
}

// Sets the active jar that the hoisted vi.mock reads at call-time.
export function withCookieJar(jar: CookieJar) {
  _activeJar = jar;
}
