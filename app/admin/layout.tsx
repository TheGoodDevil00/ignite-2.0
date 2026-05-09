"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Gauge,
  ListChecks,
  LogOut,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { label: "Dashboard", href: "/admin", icon: Gauge },
  { label: "Fixtures", href: "/admin/fixtures", icon: CalendarDays },
  { label: "Scores", href: "/admin/scores", icon: ListChecks },
  { label: "Teams & Players", href: "/admin/teams", icon: Users },
  { label: "Site Config", href: "/admin/config", icon: Settings },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (isLogin) {
    return children;
  }

  return (
    <div className="min-h-screen bg-primary text-text">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-subtle bg-nav backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/icons/logo.png" alt="" width={44} height={44} priority />
            <div>
              <p className="font-display text-4xl italic leading-none">
                IGNITE <span className="text-accent">2.0</span>
              </p>
              <p className="text-[10px] font-bold uppercase text-muted">Admin Control</p>
            </div>
          </Link>

          <nav className="mt-8 grid gap-2">
            {links.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={`flex items-center gap-3 rounded-md border px-3 py-3 text-sm font-bold transition ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-transparent text-muted hover:border-subtle hover:bg-card hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-subtle bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted">
              <Shield size={16} />
              Protected
            </div>
            <p className="mt-2 text-sm text-white">Only admin profiles can access this area.</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-field px-3 py-2 text-xs font-bold uppercase text-muted transition hover:text-white"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-subtle bg-nav px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Trophy size={20} className="text-accent" />
            <span className="text-sm font-black uppercase">IGNITE Admin</span>
          </Link>
          <button type="button" onClick={signOut} className="icon-button h-9 w-9">
            <LogOut size={16} />
          </button>
        </div>
        <nav className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {links.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={`shrink-0 rounded border px-3 py-2 text-[10px] font-bold uppercase ${
                pathname === item.href
                  ? "border-accent bg-accent text-white"
                  : "border-subtle bg-card text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
