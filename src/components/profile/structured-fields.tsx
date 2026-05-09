"use client";
import { useState } from "react";

type Profile = {
  partyComposition: string | null;
  budgetPerDayUsd: number | null;
  maxFlightHours: number | null;
  mobility: string | null;
  climatePreference: string | null;
  dietary: string[] | null;
  hardBlockers: string[] | null;
  foodAdventurousness: number | null;
  pace: string | null;
  preferredSeasons: string[] | null;
};

const ENUMS: Record<string, string[]> = {
  partyComposition: ["solo", "couple", "family-young", "family-teen", "friends"],
  mobility: ["high", "moderate", "low"],
  climatePreference: ["tropical", "temperate", "cold", "any"],
  pace: ["slow", "moderate", "packed"],
};

export function StructuredFields({ initial }: { initial: Profile }) {
  const [p, setP] = useState<Profile>(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function save<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaving(key);
    setP({ ...p, [key]: value });
    await fetch("/api/profile", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(null);
  }

  function Field({ label, k, children }: { label: string; k: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          {label} {saving === k && <span className="ml-1 normal-case text-[var(--color-accent)]">saving…</span>}
        </label>
        {children}
      </div>
    );
  }

  function Select({ k, value, options }: { k: keyof Profile; value: string | null; options: string[] }) {
    return (
      <select value={value ?? ""}
        onChange={(e) => save(k, (e.target.value || null) as Profile[typeof k])}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Structured</h2>

      <Field label="Party" k="partyComposition"><Select k="partyComposition" value={p.partyComposition} options={ENUMS.partyComposition} /></Field>
      <Field label="Mobility" k="mobility"><Select k="mobility" value={p.mobility} options={ENUMS.mobility} /></Field>
      <Field label="Climate" k="climatePreference"><Select k="climatePreference" value={p.climatePreference} options={ENUMS.climatePreference} /></Field>
      <Field label="Pace" k="pace"><Select k="pace" value={p.pace} options={ENUMS.pace} /></Field>

      <Field label="Budget per day (USD)" k="budgetPerDayUsd">
        <input type="number" min={0} value={p.budgetPerDayUsd ?? ""}
          onBlur={(e) => save("budgetPerDayUsd", e.target.value === "" ? null : Number(e.target.value))}
          onChange={(e) => setP({ ...p, budgetPerDayUsd: e.target.value === "" ? null : Number(e.target.value) })}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm" />
      </Field>

      <Field label="Max flight hours" k="maxFlightHours">
        <input type="number" min={1} max={48} value={p.maxFlightHours ?? ""}
          onBlur={(e) => save("maxFlightHours", e.target.value === "" ? null : Number(e.target.value))}
          onChange={(e) => setP({ ...p, maxFlightHours: e.target.value === "" ? null : Number(e.target.value) })}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm" />
      </Field>

      <Field label="Food adventurousness (0–5)" k="foodAdventurousness">
        <input type="range" min={0} max={5} value={p.foodAdventurousness ?? 0}
          onChange={(e) => save("foodAdventurousness", Number(e.target.value))}
          className="w-full" />
        <div className="text-xs text-[var(--color-text-muted)]">{p.foodAdventurousness ?? "—"}</div>
      </Field>

      <Field label="Dietary (comma-separated)" k="dietary">
        <input type="text" defaultValue={p.dietary?.join(", ") ?? ""}
          onBlur={(e) => save("dietary", e.target.value.trim() === "" ? null : e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm" />
      </Field>

      <Field label="Hard blockers (comma-separated)" k="hardBlockers">
        <input type="text" defaultValue={p.hardBlockers?.join(", ") ?? ""}
          onBlur={(e) => save("hardBlockers", e.target.value.trim() === "" ? null : e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm" />
      </Field>
    </section>
  );
}
