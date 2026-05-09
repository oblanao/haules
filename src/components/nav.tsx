"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/app/build", label: "Build" },
  { href: "/app/ask", label: "Ask" },
  { href: "/app/profile", label: "Profile" },
];

export function Nav({ email }: { email: string }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold tracking-wide">Haules</span>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href}
              className={`px-3 py-1.5 rounded-md text-sm ${path?.startsWith(t.href)
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span>{email}</span>
        <button onClick={logout} className="hover:text-[var(--color-text)]">Log out</button>
      </div>
    </nav>
  );
}
