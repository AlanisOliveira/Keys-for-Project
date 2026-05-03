import Link from "next/link";

import { getCurrentRole } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const role = await getCurrentRole();
  const navItems = [
    { href: "/projects", label: "Projetos" },
    ...(role === "admin" ? [{ href: "/projects/new", label: "Novo projeto" }] : []),
  ];

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-[2rem] border border-white/60 bg-brand-ink p-6 text-white shadow-panel">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-panel backdrop-blur">{children}</div>
      </div>
    </div>
  );
}
