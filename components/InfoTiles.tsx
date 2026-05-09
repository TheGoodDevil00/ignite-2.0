"use client";

import { Calendar, MapPin, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { infoTiles } from "@/lib/mockData";
import { siteConfigDefaults } from "@/lib/siteConfig";
import { createClient } from "@/lib/supabase/client";

export function InfoTiles() {
  const [eventDateDisplay, setEventDateDisplay] = useState(
    siteConfigDefaults.event_date_display
  );
  const [prizePool, setPrizePool] = useState(siteConfigDefaults.prize_pool);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadTiles() {
      const { data } = await supabase
        .from("site_config")
        .select("key,value")
        .in("key", ["event_date_display", "prize_pool"]);

      if (cancelled || !data) return;

      const values = Object.fromEntries(data.map((row) => [row.key, row.value]));
      setEventDateDisplay(values.event_date_display ?? siteConfigDefaults.event_date_display);
      setPrizePool(values.prize_pool ?? siteConfigDefaults.prize_pool);
    }

    loadTiles();

    const channel = supabase
      .channel("public-info-tiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config" },
        () => loadTiles()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const tiles = infoTiles.map((tile) => {
    if (tile.label === "Date") return { ...tile, value: eventDateDisplay };
    if (tile.label === "Prize Pool") return { ...tile, value: prizePool };
    return tile;
  });

  return (
    <section className="section-container pb-8 md:pb-12" aria-label="Tournament details">
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-4">
        {tiles.map((tile) => {
          let Icon = Calendar;
          if (tile.label === "Location") Icon = MapPin;
          else if (tile.label === "Prize Pool") Icon = Trophy;
          
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
