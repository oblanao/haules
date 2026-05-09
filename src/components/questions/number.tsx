"use client";
import { useState } from "react";
export function NumberInput({ prompt, unit, min, max, onSubmit }: { prompt: string; unit: string; min?: number; max?: number; onSubmit: (v: number) => void }) {
  const [v, setV] = useState<string>("");
  const num = v === "" ? NaN : Number(v);
  const valid = !Number.isNaN(num) && (min === undefined || num >= min) && (max === undefined || num <= max);
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <div className="flex items-center gap-2">
        <input type="number" min={min} max={max} value={v} onChange={(e) => setV(e.target.value)}
          className="w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" />
        <span className="text-sm text-[var(--color-text-muted)]">{unit}</span>
      </div>
      <button disabled={!valid} onClick={() => onSubmit(num)} className="rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Submit</button>
    </div>
  );
}
