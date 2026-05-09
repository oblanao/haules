import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach } from "vitest";

let client: ReturnType<typeof postgres>;

export async function setupTestDb() {
  beforeAll(async () => {
    client = postgres(process.env.DATABASE_URL!, { max: 2 });
    await client`CREATE EXTENSION IF NOT EXISTS citext`;
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
  });

  beforeEach(async () => {
    await client`TRUNCATE TABLE
      ratelimit_counters, chat_messages, chat_threads,
      interactions, observations, profiles, sessions, users
      RESTART IDENTITY CASCADE`;
  });

  afterAll(async () => { await client.end(); });
}
