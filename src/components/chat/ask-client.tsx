"use client";
import { useState } from "react";
import { Message } from "./message";
import { Composer } from "./composer";

type Msg = { id?: string; role: "user" | "assistant"; content: string; citations: { fields: string[]; observation_ids: string[] } | null };

export function AskClient({ threadId, initialMessages }: { threadId: string; initialMessages: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [streaming, setStreaming] = useState(false);

  async function send(text: string) {
    setMessages((m) => [...m, { role: "user", content: text, citations: null }]);
    setMessages((m) => [...m, { role: "assistant", content: "", citations: null }]);
    setStreaming(true);

    const res = await fetch(`/api/ask/${threadId}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ message: "Error." }));
      setMessages((m) => { const next = [...m]; next[next.length - 1] = { role: "assistant", content: err.message ?? "Error.", citations: null }; return next; });
      setStreaming(false);
      return;
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const evt of events) {
        const lines = evt.split("\n");
        let event = "message"; let data = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) event = line.slice(7);
          else if (line.startsWith("data: ")) data += line.slice(6);
        }
        if (!data) continue;
        const payload = JSON.parse(data);
        if (event === "message" && payload.delta) {
          setMessages((m) => { const next = [...m]; const last = next[next.length - 1]; next[next.length - 1] = { ...last, content: last.content + payload.delta }; return next; });
        } else if (event === "done") {
          setMessages((m) => { const next = [...m]; const last = next[next.length - 1]; next[next.length - 1] = { ...last, citations: payload.citations }; return next; });
        }
      }
    }
    setStreaming(false);
  }

  return (
    <section className="flex h-[calc(100dvh-160px)] flex-col gap-3">
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {messages.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Ask anything — Haules will answer using your profile.</p>}
        {messages.map((m, i) => <Message key={m.id ?? i} role={m.role} content={m.content} citations={m.citations} />)}
      </div>
      <Composer onSend={send} disabled={streaming} />
    </section>
  );
}
