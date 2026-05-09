"use client";
export function TrueFalse({ statement, onSubmit }: { statement: string; onSubmit: (v: boolean) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-lg">&ldquo;{statement}&rdquo;</p>
      <div className="flex gap-3">
        <button onClick={() => onSubmit(true)} className="flex-1 rounded-md border border-[var(--color-success)]/40 bg-[var(--color-success)]/15 py-3 font-medium text-[var(--color-success)]">True</button>
        <button onClick={() => onSubmit(false)} className="flex-1 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/15 py-3 font-medium text-[var(--color-danger)]">False</button>
      </div>
    </div>
  );
}
