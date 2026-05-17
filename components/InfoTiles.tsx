"use client";

import { Calendar, MapPin, Trophy } from "lucide-react";
import type { SiteConfig } from "@/lib/siteConfig";

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
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          
          if (tile.href) {
            return (
              <a
                href={tile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="info-tile transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                key={tile.label}
              >
                <Icon size={44} className="mb-2 text-white" strokeWidth={1.5} />
                <p className="info-tile-label">{tile.label}</p>
                <p className="info-tile-value">{tile.value}</p>
              </a>
            );
          }

          return (
            <article className="info-tile" key={tile.label}>
              <Icon size={44} className="mb-2 text-white" strokeWidth={1.5} />
              <p className="info-tile-label">{tile.label}</p>
              <p className="info-tile-value">{tile.value}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
