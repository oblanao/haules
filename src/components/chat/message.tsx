"use client";
import { useState } from "react";

type Citations = { fields: string[]; observation_ids: string[] } | null;

export function Message({ role, content, citations }: { role: "user" | "assistant"; content: string; citations: Citations }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`max-w-[85%] rounded-lg px-3 py-2 ${role === "user"
      ? "ml-auto bg-[var(--color-accent-strong)]/20 text-[var(--color-text)]"
      : "bg-[var(--color-surface-2)] text-[var(--color-text)]"}`}>
      <p className="whitespace-pre-wrap text-sm">{content}</p>
      {role === "assistant" && citations && (citations.fields.length > 0 || citations.observation_ids.length > 0) && (
        <div className="mt-2 text-xs">
          <button onClick={() => setOpen(!open)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            {open ? "hide" : "what made you say that?"}
          </button>
          {open && (
            <div className="mt-1 rounded bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text-muted)]">
              {citations.fields.length > 0 && <div>fields: {citations.fields.join(", ")}</div>}
              {citations.observation_ids.length > 0 && <div>observations: {citations.observation_ids.join(", ")}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
