"use client";
import { useState } from "react";

type Obs = { id: string; note: string; category: string };

export function ObservationsList({ initial }: { initial: Obs[] }) {
  const [list, setList] = useState(initial);

  async function remove(id: string) {
    setList(list.filter((o) => o.id !== id));
    await fetch(`/api/profile/observations/${id}`, { method: "DELETE" });
  }

  return (
    <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Observations</h2>
      {list.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Nothing yet. Answer a few questions on the Build tab.</p>}
      <ul className="space-y-2">
        {list.map((o) => (
          <li key={o.id} className="group flex items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
            <span className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-text-muted)]">{o.category}</span>
            <span className="flex-1 text-sm">{o.note}</span>
            <button onClick={() => remove(o.id)} className="opacity-0 transition group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
