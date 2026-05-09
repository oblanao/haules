"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type T = { id: string; title: string | null; createdAt: Date | string };

export function ThreadList({ threads, activeId }: { threads: T[]; activeId: string }) {
  const router = useRouter();

  async function newThread() {
    const res = await fetch("/api/threads", { method: "POST" });
    const t = await res.json();
    router.push(`/app/ask/${t.id}`);
  }

  return (
    <aside className="space-y-2">
      <button onClick={newThread} className="w-full rounded-md bg-[var(--color-accent-strong)] py-1.5 text-sm font-medium text-white">+ New thread</button>
      <ul className="space-y-1">
        {threads.map((t) => (
          <li key={t.id}>
            <Link href={`/app/ask/${t.id}`}
              className={`block truncate rounded-md px-2 py-1.5 text-sm ${t.id === activeId
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
              {t.title ?? "New conversation"}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
