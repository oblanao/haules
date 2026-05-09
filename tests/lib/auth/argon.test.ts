import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/argon";

describe("argon password helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("hunter22");
    expect(hash).not.toContain("hunter22");
    expect(await verifyPassword("hunter22", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toEqual(b);
  });
});
