"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useCountdown } from "@/lib/countdown";

type CountdownScreenProps = {
  unlockDate: string;
  onComplete: () => void;
  onUnlockNow: () => void;
};

const units = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
] as const;

function format(value: number) {
  return value.toString().padStart(2, "0");
}

export function CountdownScreen({
  unlockDate,
  onComplete,
  onUnlockNow,
}: CountdownScreenProps) {
  const { timeLeft, tick } = useCountdown(unlockDate, onComplete);

  return (
    <main className="countdown-screen">
      <div className="countdown-shell">
        <motion.div
          animate={{ opacity: [0.86, 1, 0.86], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="countdown-logo"
        >
          <Image
            src="/icons/logo.png"
            alt="IGNITE 2.0 shield"
            width={86}
            height={86}
            priority
          />
        </motion.div>

        <p className="countdown-kicker">Something big is coming!!!</p>
        <h1 className="brand-heading countdown-title">
          <span>IGNITE</span>
          <span className="text-accent"> 2.0</span>
        </h1>
        <p className="countdown-label">Unlocks In</p>

        <div className="countdown-grid" aria-label="Countdown timer">
          {units.map((unit, index) => (
            <div className="countdown-unit" key={unit.key}>
              <motion.span
                key={`${unit.key}-${tick}`}
                initial={{ scale: 0.92 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="countdown-number"
              >
                {format(timeLeft[unit.key])}
              </motion.span>
              <span className="countdown-unit-label">{unit.label}</span>
              {index < units.length - 1 ? (
                <span className="countdown-separator" aria-hidden="true">
                  :
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* TEMP: remove this manual unlock button before shipping to production. */}
        <button
          type="button"
          className="primary-pill mt-8"
          onClick={onUnlockNow}
        >
          Unlock Site Now
        </button>

        <a
          className="primary-pill mt-3 inline-flex items-center gap-2"
          href="/admin"
          aria-label="Open admin dashboard"
        >
          <ShieldCheck size={16} aria-hidden="true" />
          Admin Dashboard
        </a>
      </div>
    </main>
  );
}
