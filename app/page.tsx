"use client";

import { useState } from "react";
import { AboutSection } from "@/components/AboutSection";
import { CountdownScreen } from "@/components/CountdownScreen";
import { FixturesSection } from "@/components/FixturesSection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { InfoTiles } from "@/components/InfoTiles";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { Navbar } from "@/components/Navbar";
import { RegistrationSection } from "@/components/RegistrationSection";

const DEFAULT_UNLOCK_DATE = "2026-05-15T18:00:00+05:30";
const SITE_UNLOCKED = process.env.NEXT_PUBLIC_SITE_UNLOCKED === "true";

export default function HomePage() {
  const [isUnlocked, setIsUnlocked] = useState(SITE_UNLOCKED);
  const unlockDate = process.env.NEXT_PUBLIC_UNLOCK_DATE ?? DEFAULT_UNLOCK_DATE;

  if (!isUnlocked) {
    return (
      <CountdownScreen
        unlockDate={unlockDate}
        onComplete={() => setIsUnlocked(true)}
        onUnlockNow={() => setIsUnlocked(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text">
      <Navbar />
      <main>
        <section className="intro-section">
          <HeroSection />
          <InfoTiles />
          <AboutSection />
        </section>
        <RegistrationSection />
        <FixturesSection />
        <LeaderboardSection />
      </main>
      <Footer />
    </div>
  );
}
