"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { siteConfigDefaults } from "@/lib/siteConfig";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Image from "next/image";
import mgocsmLogo from "@/mgocsm logo.png";
import igniteLogo from "@/logo.svg";

const defaultButtonLinks = [
  { label: "View Fixtures", href: "#fixtures" },
  { label: "Live Score", href: "#fixtures" },
];

export function HeroSection() {
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
      .channel("public-hero-config")
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
    <section id="home" className="section-container hero-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <div className="mb-4 flex flex-col items-center justify-center gap-5 sm:mb-6 sm:gap-6">
          <Image
            src={mgocsmLogo}
            alt="MGOCSM Logo"
            width={200}
            height={80}
            className="h-auto w-[120px] object-contain sm:w-[160px] md:w-[200px]"
            priority
          />
          <Image
            src={igniteLogo}
            alt="IGNITE 2.0 shield"
            width={400}
            height={160}
            className="h-auto w-[240px] object-contain sm:w-[320px] md:w-[400px]"
            priority
          />
        </div>
        <p className="hero-tagline">
          <span>PLAY. COMPETE. </span>
          <span className="text-accent">WIN!!!</span>
        </p>
        <p className="hero-subtitle">The most awaited football event is back!</p>

        <div className="mt-8 flex w-full max-w-[320px] flex-wrap justify-center gap-1.5 sm:max-w-xl sm:gap-4">
          {filloutLink ? (
            <a className="glass-button" href={filloutLink} target="_blank" rel="noopener noreferrer">
              JOIN NOW
            </a>
          ) : null}
          {defaultButtonLinks.map((button) => (
            <a className="glass-button" href={button.href} key={button.label}>
              {button.label}
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
