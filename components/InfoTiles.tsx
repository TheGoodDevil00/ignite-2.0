import Image from "next/image";
import { infoTiles } from "@/lib/mockData";

export function InfoTiles() {
  return (
    <section className="section-container pb-8 md:pb-12" aria-label="Tournament details">
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-4">
        {infoTiles.map((tile) => (
          <article className="info-tile" key={tile.label}>
            <Image
              src={tile.image}
              alt=""
              width={50}
              height={50}
              priority={tile.label === "Date"}
              className="h-11 w-11 object-contain sm:h-14 sm:w-14"
            />
            <p className="info-tile-label">{tile.label}</p>
            <p className="info-tile-value">{tile.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
