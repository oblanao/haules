import { vi } from "vitest";

type CookieJar = Map<string, string>;

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

export function withCookieJar(jar: CookieJar) {
  vi.mock("next/headers", () => ({
    cookies: async () => ({
      get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined),
      set: (n: string, v: string) => {
        jar.set(n, v);
      },
      delete: (n: string) => {
        jar.delete(n);
      },
    }),
  }));
}
