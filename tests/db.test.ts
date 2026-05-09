import { describe, it, expect } from "vitest";
import { setupTestDb } from "./support/db";
import { db, schema } from "@/lib/db/client";

setupTestDb();

describe("db harness", () => {
  it("can insert and read a user", async () => {
    const [u] = await db.insert(schema.users).values({
      email: "a@example.com",
      passwordHash: "x",
    }).returning();
    expect(u.email).toBe("a@example.com");
  });
});
