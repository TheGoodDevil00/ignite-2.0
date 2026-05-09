"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { navLinks } from "@/lib/mockData";
import { siteConfigDefaults } from "@/lib/siteConfig";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import mgocsmLogo from "@/mgocsm logo.png";
import igniteLogo from "@/Ignite2.0 logo.svg";

export function Navbar() {
  const [filloutLink, setFilloutLink] = useState(siteConfigDefaults.fillout_link);
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    []
  );

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    async function loadConfig() {
      const { data } = await client
        .from("site_config")
        .select("value")
        .eq("key", "fillout_link")
        .maybeSingle();

      if (!cancelled && data) {
        setFilloutLink(data.value);
      }
    }

    loadConfig();

    const channel = client
      .channel("public-navbar-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config", filter: "key=eq.fillout_link" },
        () => loadConfig()
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-subtle bg-nav backdrop-blur-xl">
      <nav className="section-container flex h-14 items-center justify-between gap-2 px-2 sm:px-6">
        <a className="flex shrink-0 items-center gap-2 sm:gap-3" href="#home" aria-label="IGNITE 2.0 home">
          <Image src={mgocsmLogo} alt="MGOCSM Logo" width={60} height={32} className="h-[24px] sm:h-[32px] w-auto object-contain" priority />
          <Image src={igniteLogo} alt="IGNITE 2.0 shield" width={60} height={32} className="h-[24px] sm:h-[32px] w-auto object-contain" priority />
        </a>

        <div className="flex flex-1 items-center justify-start gap-3 overflow-x-auto no-scrollbar px-1 sm:justify-center sm:gap-6">
          {navLinks.map((link) => (
            <a className="nav-link whitespace-nowrap text-[9px] sm:text-[11px]" href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            className="register-button inline-flex items-center gap-1 px-3 py-1.5 text-[10px] sm:px-4 sm:py-2 sm:text-xs"
            href="/admin"
            aria-label="Open admin dashboard"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            Admin
          </a>
          {filloutLink ? (
            <a className="register-button px-3 py-1.5 text-[10px] sm:px-5 sm:py-2 sm:text-xs" href={filloutLink} target="_blank" rel="noopener noreferrer">
              Join Now
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
