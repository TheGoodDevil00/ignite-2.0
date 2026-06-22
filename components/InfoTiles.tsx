"use client";

import { Calendar, MapPin, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { SiteConfig } from "@/lib/siteConfig";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function InfoTiles({ config }: { config: SiteConfig }) {
  const tiles = [
    {
      label: config.event_date_label,
      value: config.event_date_display,
      icon: Calendar,
    },
    {
      label: config.location_label,
      value: config.location_display,
      icon: MapPin,
      href: config.location_link,
    },
    {
      label: config.prize_pool_label,
      value: config.prize_pool,
      icon: Trophy,
    },
  ];

  return (
    <section className="section-container pb-8 md:pb-12" aria-label="Tournament details">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-4"
      >
        {tiles.map((tile) => {
          const Icon = tile.icon;
          
          if (tile.href) {
            return (
              <motion.a
                variants={itemVariants}
                href={tile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="info-tile active-scale transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                key={tile.label}
              >
                <Icon size={44} className="mb-2 text-white" strokeWidth={1.5} />
                <p className="info-tile-label">{tile.label}</p>
                <p className="info-tile-value">{tile.value}</p>
              </motion.a>
            );
          }

          return (
            <motion.article
              variants={itemVariants}
              className="info-tile"
              key={tile.label}
            >
              <Icon size={44} className="mb-2 text-white" strokeWidth={1.5} />
              <p className="info-tile-label">{tile.label}</p>
              <p className="info-tile-value">{tile.value}</p>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
