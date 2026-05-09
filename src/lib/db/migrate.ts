import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/lib/env";

async function main() {
  const client = postgres(env().DATABASE_URL, { max: 1 });
  await client`CREATE EXTENSION IF NOT EXISTS citext`;
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
  await client.end();
  console.log("migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
