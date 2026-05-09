"use client";
export function ThisOrThat({ prompt, a, b, onSubmit }:
  { prompt: string; a: { label: string; subtitle: string }; b: { label: string; subtitle: string }; onSubmit: (v: "a" | "b") => void }) {
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <button onClick={() => onSubmit("a")} className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-5 text-center hover:bg-[var(--color-accent)]/20">
          <div className="font-semibold">{a.label}</div>
          {a.subtitle && <div className="mt-1 text-xs text-[var(--color-text-muted)]">{a.subtitle}</div>}
        </button>
        <div className="self-center text-sm font-bold text-[var(--color-text-muted)]">VS</div>
        <button onClick={() => onSubmit("b")} className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-5 text-center hover:bg-[var(--color-accent)]/20">
          <div className="font-semibold">{b.label}</div>
          {b.subtitle && <div className="mt-1 text-xs text-[var(--color-text-muted)]">{b.subtitle}</div>}
        </button>
      </div>
    </div>
  );
}
