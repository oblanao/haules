"use client";
import { useState } from "react";
export function MultiSelect({ prompt, options, onSubmit }: { prompt: string; options: string[]; onSubmit: (v: string[]) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  function toggle(o: string) { const next = new Set(picked); next.has(o) ? next.delete(o) : next.add(o); setPicked(next); }
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => toggle(o)}
            className={`rounded-md border px-3 py-2 text-sm ${picked.has(o)
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
              : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]"}`}>
            {o}
          </button>
        ))}
      </div>
      <button onClick={() => onSubmit([...picked])} className="rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm font-medium text-white">Submit</button>
    </div>
  );
}
