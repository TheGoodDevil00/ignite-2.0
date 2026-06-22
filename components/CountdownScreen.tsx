"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useCountdown } from "@/lib/countdown";
import { isEnabled, type SiteConfig } from "@/lib/siteConfig";

type CountdownScreenProps = {
  unlockDate: string;
  config: SiteConfig;
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
  config,
  onComplete,
  onUnlockNow,
}: CountdownScreenProps) {
  const { timeLeft, tick } = useCountdown(unlockDate, onComplete);
  const filloutLink = config.fillout_link.trim();
  const titleParts = config.countdown_title.split(/\s+/);
  const accentPart = titleParts.pop() ?? "";
  const titleLead = titleParts.join(" ");

  return (
    <main className="countdown-screen">
      <div className="countdown-shell">
        <motion.div
          animate={{ opacity: [0.86, 1, 0.86], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="countdown-logo flex items-center justify-center gap-4"
        >
          <img
            src={config.mgocsm_logo_url}
            alt={`${config.organizer_name} logo`}
            className="h-[60px] w-auto object-contain"
          />
          <div className="h-[32px] w-[1px] bg-white/20" />
          <img
            src={config.ignite_logo_url}
            alt={`${config.site_title} logo`}
            className="h-[60px] w-auto object-contain"
          />
        </motion.div>

        <p className="countdown-kicker" style={{ marginBottom: "0.5rem" }}>{config.countdown_date_label}</p>
        <p className="countdown-kicker">{config.countdown_kicker}</p>
        <h1 className="brand-heading countdown-title text-balance">
          <span>{titleLead}</span>
          <span className="text-accent"> {accentPart}</span>
        </h1>
        <p className="countdown-label">{config.countdown_label}</p>

        <div className="countdown-grid" aria-label="Countdown timer">
          {units.map((unit, index) => (
            <div className="countdown-unit" key={unit.key}>
              <motion.span
                key={`${unit.key}-${tick}`}
                initial={{ scale: 0.92 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="countdown-number tabular-nums"
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

        {filloutLink ? (
          <a
            className="primary-pill mt-8 inline-flex items-center gap-2 active-scale"
            href={filloutLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginBottom: "-1rem" }}
          >
            {config.register_button_label}
          </a>
        ) : null}

        {isEnabled(config.countdown_manual_unlock_visible, true) ? (
          <button
            type="button"
            className="primary-pill mt-8 active-scale"
            onClick={onUnlockNow}
          >
            {config.countdown_manual_unlock_label}
          </button>
        ) : null}

        <a
          className="primary-pill mt-3 inline-flex items-center gap-2 active-scale"
          href="/admin"
          aria-label="Open admin dashboard"
        >
          <ShieldCheck size={16} aria-hidden="true" />
          {config.countdown_admin_label}
        </a>
      </div>
    </main>
  );
}
