import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";

async function load(userId: string) {
  const [structured] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
  const observations = await db.select({ id: schema.observations.id, note: schema.observations.note, category: schema.observations.category, createdAt: schema.observations.createdAt })
    .from(schema.observations).where(eq(schema.observations.userId, userId))
    .orderBy(desc(schema.observations.createdAt));
  return { structured, observations };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await load(user.id));
}

const Patch = z.object({
  partyComposition: z.enum(["solo", "couple", "family-young", "family-teen", "friends"]).nullable().optional(),
  budgetPerDayUsd: z.number().int().positive().max(100_000).nullable().optional(),
  maxFlightHours: z.number().int().min(1).max(48).nullable().optional(),
  mobility: z.enum(["high", "moderate", "low"]).nullable().optional(),
  climatePreference: z.enum(["tropical", "temperate", "cold", "any"]).nullable().optional(),
  dietary: z.array(z.string().max(40)).max(20).nullable().optional(),
  hardBlockers: z.array(z.string().max(80)).max(20).nullable().optional(),
  foodAdventurousness: z.number().int().min(0).max(5).nullable().optional(),
  pace: z.enum(["slow", "moderate", "packed"]).nullable().optional(),
  preferredSeasons: z.array(z.enum(["spring", "summer", "fall", "winter", "shoulder"])).max(5).nullable().optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.issues }, { status: 400 });
  await db.update(schema.profiles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await db.delete(schema.observations).where(eq(schema.observations.userId, user.id));
  await db.update(schema.profiles).set({
    partyComposition: null, budgetPerDayUsd: null, maxFlightHours: null,
    mobility: null, climatePreference: null, dietary: null, hardBlockers: null,
    foodAdventurousness: null, pace: null, preferredSeasons: null,
    coverageSignals: 0, updatedAt: new Date(),
  }).where(eq(schema.profiles.userId, user.id));
  return NextResponse.json({ ok: true });
}
