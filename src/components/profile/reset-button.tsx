"use client";
import { useState } from "react";

export function ResetButton() {
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  async function reset() {
    setWorking(true);
    await fetch("/api/profile", { method: "DELETE" });
    location.reload();
  }

  return (
    <div className="border-t border-[var(--color-border)] pt-6">
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
          Reset entire profile
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-danger)]">This wipes structured fields and observations. Are you sure?</span>
          <button onClick={reset} disabled={working} className="rounded bg-[var(--color-danger)] px-3 py-1 text-sm text-white disabled:opacity-50">
            {working ? "Resetting…" : "Yes, reset"}
          </button>
          <button onClick={() => setConfirming(false)} className="text-sm text-[var(--color-text-muted)]">Cancel</button>
        </div>
      )}
    </div>
  );
}
