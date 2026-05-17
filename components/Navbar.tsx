"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navLinks } from "@/lib/mockData";
import { siteConfigDefaults } from "@/lib/siteConfig";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import mgocsmLogo from "@/mgocsm logo.png";
import igniteLogo from "@/Ignite2.0 logo.svg";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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

  // Disable scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-subtle bg-nav backdrop-blur-xl">
        <nav className="section-container flex h-14 items-center justify-between gap-2 px-2 sm:px-6">
          <a className="flex shrink-0 items-center gap-2 sm:gap-3" href="#home" aria-label="IGNITE 2.0 home">
            <Image src={mgocsmLogo} alt="MGOCSM Logo" width={60} height={32} className="h-[24px] sm:h-[32px] w-auto object-contain" priority />
            <Image src={igniteLogo} alt="IGNITE 2.0 shield" width={60} height={32} className="h-[24px] sm:h-[32px] w-auto object-contain" priority />
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6 px-1">
            {navLinks.map((link) => (
              <a className="nav-link whitespace-nowrap text-[11px]" href={link.href} key={`${link.label}-${link.href}`}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {filloutLink ? (
              <a className="register-button px-3 py-1.5 text-[10px] sm:px-5 sm:py-2 sm:text-xs" href={filloutLink} target="_blank" rel="noopener noreferrer">
                Register Now
              </a>
            ) : null}
            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-subtle bg-card text-text transition hover:border-accent hover:text-accent md:hidden"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-x-0 top-14 bottom-0 z-40 flex flex-col justify-between bg-nav/95 backdrop-blur-2xl px-6 py-8 border-t border-subtle md:hidden cursor-pointer"
          >
            <div className="flex flex-col gap-5 mt-4">
              {navLinks.map((link, index) => (
                <motion.a
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="border-b border-subtle/50 pb-3 text-lg font-semibold uppercase tracking-wider text-text transition hover:text-accent"
                >
                  {link.label}
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: navLinks.length * 0.04 + 0.1 }}
              className="flex flex-col gap-4 border-t border-subtle pt-6 mb-4"
            >
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-widest text-muted">MGOCSM Dehuroad</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
