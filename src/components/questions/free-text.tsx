"use client";
import { useState } from "react";

export function FreeText({ prompt, onSubmit }: { prompt: string; onSubmit: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <textarea value={v} onChange={(e) => setV(e.target.value)}
        className="min-h-24 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm" />
      <button disabled={v.trim().length === 0} onClick={() => onSubmit(v.trim())}
        className="rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Submit</button>
    </div>
  );
}
