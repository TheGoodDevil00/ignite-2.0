"use client";

import { sponsors } from "@/lib/mockData";

export function SponsorsTicker() {
  // Double the list locally to ensure there are plenty of items covering wide displays
  const items = [...sponsors, ...sponsors];

  return (
    <section className="marquee-container my-4" aria-label="Tournament Sponsors">
      <div className="marquee-content">
        {items.map((sponsor, index) => (
          <div key={`${sponsor}-${index}`} className="marquee-item">
            <span>{sponsor}</span>
            <span className="marquee-separator" aria-hidden="true">★</span>
          </div>
        ))}
      </div>
      {/* Duplicate content container for seamless gap-less loop */}
      <div className="marquee-content" aria-hidden="true">
        {items.map((sponsor, index) => (
          <div key={`${sponsor}-loop-${index}`} className="marquee-item">
            <span>{sponsor}</span>
            <span className="marquee-separator" aria-hidden="true">★</span>
          </div>
        ))}
      </div>
    </section>
  );
}
