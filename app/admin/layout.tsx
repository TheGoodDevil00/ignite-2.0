"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import type { UserRole } from "@/lib/supabase/types";

const links = [
  { label: "Dashboard", href: "/admin", icon: Gauge, roles: ["admin"] },
  { label: "Fixtures", href: "/admin/fixtures", icon: CalendarDays, roles: ["admin", "scorer"] },
  { label: "Scores", href: "/admin/scores", icon: ListChecks, roles: ["admin", "scorer"] },
  { label: "Teams & Players", href: "/admin/teams", icon: Users, roles: ["admin"] },
  { label: "Site Config", href: "/admin/config", icon: Settings, roles: ["admin"] },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const visibleLinks = useMemo(
    () => links.filter((link) => role && link.roles.includes(role)),
    [role]
  );

  useEffect(() => {
    setActiveHref(null);
  }, [pathname]);

  useEffect(() => {
    if (isLogin) return;

    let cancelled = false;
    const supabase = createClient();

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setRole(data?.role ?? null);
      }
    }

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [isLogin]);

  useEffect(() => {
    visibleLinks.forEach((link) => router.prefetch(link.href));
  }, [router, visibleLinks]);

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
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              const activePath = activeHref ?? pathname;
              const active = activePath === item.href;

              return (
                <Link
                  href={item.href}
                  key={item.href}
                  prefetch
                  onClick={() => setActiveHref(item.href)}
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
            <p className="mt-2 text-sm text-white">
              {role === "scorer"
                ? "Scorer access is limited to fixtures and scores."
                : "Only admin and scorer profiles can access this area."}
            </p>
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
          {visibleLinks.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              prefetch
              onClick={() => setActiveHref(item.href)}
              className={`shrink-0 rounded border px-3 py-2 text-[10px] font-bold uppercase ${
                (activeHref ?? pathname) === item.href
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
