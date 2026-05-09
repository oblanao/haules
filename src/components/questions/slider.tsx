"use client";
import { useState } from "react";
export function Slider({ prompt, min, max, min_label, max_label, onSubmit }:
  { prompt: string; min: number; max: number; min_label: string; max_label: string; onSubmit: (v: number) => void }) {
  const [v, setV] = useState(Math.round((min + max) / 2));
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <input type="range" min={min} max={max} value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]"><span>{min} — {min_label}</span><span className="text-[var(--color-text)]">{v}</span><span>{max} — {max_label}</span></div>
      <button onClick={() => onSubmit(v)} className="rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm font-medium text-white">Submit</button>
    </div>
  );
}
