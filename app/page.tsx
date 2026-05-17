"use client";

import { useEffect, useMemo, useState } from "react";
import { AboutSection } from "@/components/AboutSection";
import { CountdownScreen } from "@/components/CountdownScreen";
import { FixturesSection } from "@/components/FixturesSection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { InfoTiles } from "@/components/InfoTiles";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { Navbar } from "@/components/Navbar";
import { SponsorsTicker } from "@/components/SponsorsTicker";
import { isEnabled, mergeSiteConfig, siteConfigDefaults, type SiteConfig } from "@/lib/siteConfig";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const SITE_UNLOCKED = process.env.NEXT_PUBLIC_SITE_UNLOCKED === "true";

export default function HomePage() {
  const [manualUnlock, setManualUnlock] = useState(SITE_UNLOCKED);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(mergeSiteConfig({
    site_locked: SITE_UNLOCKED ? "false" : siteConfigDefaults.site_locked,
    unlock_date: process.env.NEXT_PUBLIC_UNLOCK_DATE ?? siteConfigDefaults.unlock_date,
  }));
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    []
  );

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    let cancelled = false;

    async function loadConfig() {
      const { data } = await client.from("site_config").select("key,value");
      if (cancelled || !data) return;

      setSiteConfig((current) =>
        mergeSiteConfig({
          ...current,
          ...Object.fromEntries(data.map((row) => [row.key, row.value])),
        })
      );
    }

    loadConfig();

    const channel = client
      .channel("public-site-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config" },
        () => loadConfig()
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [supabase]);

  const unlockDate = siteConfig.unlock_date;
  const unlockTime = Date.parse(unlockDate);
  const isUnlocked =
    manualUnlock ||
    siteConfig.site_locked !== "true" ||
    (Number.isFinite(unlockTime) && Date.now() >= unlockTime);

  if (!isUnlocked) {
    return (
      <CountdownScreen
        unlockDate={unlockDate}
        config={siteConfig}
        onComplete={() => setManualUnlock(true)}
        onUnlockNow={() => setManualUnlock(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text">
      <Navbar config={siteConfig} />
      {siteConfig.announcement_banner ? (
        <div className="border-b border-subtle bg-accent px-4 py-2 text-center text-xs font-black uppercase text-white">
          {siteConfig.announcement_banner}
        </div>
      ) : null}
      <main>
        <section className="intro-section">
          <HeroSection config={siteConfig} />
          <InfoTiles config={siteConfig} />
        </section>
        {isEnabled(siteConfig.sponsors_visible, true) ? (
          <SponsorsTicker config={siteConfig} />
        ) : null}
        {isEnabled(siteConfig.fixtures_visible, true) ? <FixturesSection /> : null}
        <LeaderboardSection visible={isEnabled(siteConfig.leaderboard_visible)} />
        {isEnabled(siteConfig.about_visible, true) ? (
          <AboutSection config={siteConfig} />
        ) : null}
      </main>
      <Footer config={siteConfig} />
    </div>
  );
}
