import { getCurrentUser } from "@/lib/auth/current-user";
import { db, schema } from "@/lib/db/client";
import { eq, desc } from "drizzle-orm";
import { StructuredFields } from "@/components/profile/structured-fields";
import { ObservationsList } from "@/components/profile/observations-list";
import { ResetButton } from "@/components/profile/reset-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = (await getCurrentUser())!;
  const [structured] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const observations = await db.select().from(schema.observations)
    .where(eq(schema.observations.userId, user.id))
    .orderBy(desc(schema.observations.createdAt));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="text-sm text-[var(--color-text-muted)]">What Haules has learned about you so far. Edit anything that&apos;s wrong.</p>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        <StructuredFields initial={structured} />
        <ObservationsList initial={observations.map((o) => ({ id: o.id, note: o.note, category: o.category }))} />
      </div>
      <ResetButton />
    </div>
  );
}
