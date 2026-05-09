"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) router.replace("/app/build");
    else setError(res.status === 401 ? "Wrong email or password." : "Something went wrong.");
  }

  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" required />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button disabled={loading} className="w-full rounded-md bg-[var(--color-accent-strong)] py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          New here? <Link className="text-[var(--color-accent)]" href="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
