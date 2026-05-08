import { Calendar, MapPin, Trophy } from "lucide-react";
import { infoTiles } from "@/lib/mockData";

export function InfoTiles() {
  return (
    <section className="section-container pb-8 md:pb-12" aria-label="Tournament details">
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-4">
        {infoTiles.map((tile) => {
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
