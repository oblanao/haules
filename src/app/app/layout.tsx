import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-dvh">
      <Nav email={user.email} />
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
