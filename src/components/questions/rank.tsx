"use client";
import { useState } from "react";

export function Rank({ prompt, items, onSubmit }: { prompt: string; items: string[]; onSubmit: (v: string[]) => void }) {
  const [order, setOrder] = useState<string[]>(items);
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  }
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <ul className="space-y-2">
        {order.map((item, i) => (
          <li key={item} className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-[var(--color-bg)]">{i + 1}</span>
            <span className="flex-1 text-sm">{item}</span>
            <button onClick={() => move(i, -1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">↑</button>
            <button onClick={() => move(i, 1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">↓</button>
          </li>
        ))}
      </ul>
      <button onClick={() => onSubmit(order)} className="rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm font-medium text-white">Submit</button>
    </div>
  );
}
