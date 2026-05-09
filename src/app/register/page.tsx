"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 12) { setError("Password must be at least 12 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) router.replace("/app/build");
    else if (res.status === 409) setError("That email is already taken.");
    else setError("Something went wrong.");
  }

  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h1 className="text-xl font-semibold">Create your Haules account</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" required />
        <input type="password" placeholder="Password (min 12 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" required />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button disabled={loading} className="w-full rounded-md bg-[var(--color-accent-strong)] py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          Already have one? <Link className="text-[var(--color-accent)]" href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
