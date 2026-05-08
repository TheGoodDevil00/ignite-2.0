import Image from "next/image";
import { fixtures, type FixtureStatus } from "@/lib/mockData";

const statusLabels: Record<FixtureStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
};

export function FixturesSection() {
  return (
    <section id="fixtures" className="section-band bg-section">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="content-heading">Fixtures</h2>
          <p className="mt-2 text-sm text-muted">Opening week match schedule</p>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="relative mx-auto h-[220px] w-full max-w-[320px] overflow-hidden rounded-xl">
            <Image
              src="/images/fixtures-art.png"
              alt=""
              fill
              sizes="320px"
              className="object-contain"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fixtures.map((fixture) => (
              <article className="fixture-card" key={fixture.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase text-muted">
                    Match {fixture.id}
                  </p>
                  <span className={`status-badge status-${fixture.status}`}>
                    {statusLabels[fixture.status]}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="fixture-team">{fixture.teamA}</p>
                  <p className="fixture-score">{fixture.score}</p>
                  <p className="fixture-team text-right">{fixture.teamB}</p>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase text-muted">
                  {fixture.time}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
