"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionPayload, AnswerPayload } from "@/lib/llm/question-schemas";
import { RenderQuestion } from "@/components/questions/render";

type State =
  | { kind: "loading" }
  | { kind: "ready"; interactionId: string; payload: QuestionPayload }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export function BuildLoopClient() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const answeredCount = useRef(0);
  const [showCoverageNudge, setShowCoverageNudge] = useState(false);

  const fetchNext = useCallback(async () => {
    setState({ kind: "loading" });
    const res = await fetch("/api/build/next-question");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setState({ kind: "error", message: body.message ?? `Error (${res.status}). Try again later.` });
      return;
    }
    const body = await res.json();
    setState({ kind: "ready", interactionId: body.interactionId, payload: body.payload });
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  async function submit(answer: AnswerPayload, interactionId: string) {
    setState({ kind: "submitting" });
    const res = await fetch("/api/build/answer", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ interactionId, answer }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setState({ kind: "error", message: body.message ?? "Could not save your answer." });
      return;
    }
    answeredCount.current += 1;
    if (answeredCount.current % 5 === 0) setShowCoverageNudge(true);
    fetchNext();
  }

  async function skip(interactionId: string) {
    await fetch("/api/build/answer", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ interactionId, answer: { skipped: true } }),
    });
    fetchNext();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tell Haules about you</h1>
        <p className="text-sm text-[var(--color-text-muted)]">One question at a time. Skip anything that doesn't fit.</p>
      </header>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 min-h-64">
        {state.kind === "loading" && <p className="text-[var(--color-text-muted)]">Thinking of a good question…</p>}
        {state.kind === "submitting" && <p className="text-[var(--color-text-muted)]">Saving your answer…</p>}
        {state.kind === "error" && (
          <div className="space-y-3">
            <p className="text-[var(--color-danger)]">{state.message}</p>
            <button onClick={fetchNext} className="rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-sm text-white">Try again</button>
          </div>
        )}
        {state.kind === "ready" && (
          <div className="space-y-4">
            <RenderQuestion q={state.payload} onSubmit={(a) => submit(a, state.interactionId)} />
            <button onClick={() => skip(state.interactionId)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Skip this question</button>
          </div>
        )}
      </div>

      {showCoverageNudge && (
        <div className="rounded-md border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-3 text-sm">
          Nice, {answeredCount.current} answers in. Want to peek at <a className="underline" href="/app/profile">your profile</a>?
          <button onClick={() => setShowCoverageNudge(false)} className="ml-3 text-xs text-[var(--color-text-muted)]">dismiss</button>
        </div>
      )}
    </div>
  );
}
