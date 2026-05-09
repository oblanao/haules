"use client";
import { useState } from "react";
export function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [v, setV] = useState("");
  function send() { if (!v.trim() || disabled) return; onSend(v.trim()); setV(""); }
  return (
    <div className="flex gap-2">
      <textarea value={v} onChange={(e) => setV(e.target.value)} placeholder="Ask Haules anything…"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        className="min-h-12 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm" />
      <button onClick={send} disabled={disabled || !v.trim()}
        className="self-end rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Send</button>
    </div>
  );
}
