"use client";
export function ChooseOne({ prompt, options, onSubmit }: { prompt: string; options: string[]; onSubmit: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-lg">{prompt}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onSubmit(o)}
            className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm hover:bg-[var(--color-accent)]/20">
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
