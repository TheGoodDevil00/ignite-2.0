"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { fixtures, type FixtureStatus } from "@/lib/mockData";

const statusLabels: Record<FixtureStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
};

export function FixturesSection() {
  const [filter, setFilter] = useState<FixtureStatus | "all">("all");

  const filteredFixtures = fixtures.filter(
    (f) => filter === "all" || f.status === filter
  );

  return (
    <section id="fixtures" className="section-band bg-section">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="content-heading">Fixtures</h2>
        </div>

        <div className="mt-8 flex justify-center gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 text-xs font-bold uppercase rounded-sm border border-subtle transition-colors ${
              filter === "all" ? "bg-accent text-white border-accent" : "bg-card text-muted hover:text-white"
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-6 py-2 text-xs font-bold uppercase rounded-sm border border-subtle transition-colors ${
              filter === "upcoming" ? "bg-accent text-white border-accent" : "bg-card text-muted hover:text-white"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("live")}
            className={`px-6 py-2 text-xs font-bold uppercase rounded-sm border border-subtle transition-colors ${
              filter === "live" ? "bg-accent text-white border-accent" : "bg-card text-muted hover:text-white"
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-6 py-2 text-xs font-bold uppercase rounded-sm border border-subtle transition-colors ${
              filter === "completed" ? "bg-accent text-white border-accent" : "bg-card text-muted hover:text-white"
            }`}
          >
            Completed
          </button>
        </div>

        <div className="mx-auto max-w-4xl grid gap-3">
          {filteredFixtures.map((fixture) => (
            <div key={fixture.id} className="flex flex-col sm:flex-row items-center gap-4 bg-card border border-subtle rounded-lg p-4 transition-colors hover:border-muted/30">
              <div className="w-full sm:w-48 text-center sm:text-left shrink-0">
                <p className="text-sm font-bold text-white uppercase">Match {fixture.id < 10 ? `0${fixture.id}` : fixture.id}</p>
                <p className="text-xs font-semibold text-muted uppercase mt-1">{fixture.time}</p>
              </div>

              <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 w-full">
                <div className="flex-1 flex items-center justify-end gap-3 text-right">
                  <span className="text-sm font-bold text-white whitespace-nowrap">{fixture.teamA}</span>
                  <div className="h-8 w-8 rounded-full bg-field border border-subtle flex items-center justify-center text-muted shrink-0">
                    <Shield size={16} />
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center w-16">
                  {fixture.status === "live" ? (
                    <span className="text-lg font-black text-accent">{fixture.score}</span>
                  ) : fixture.status === "completed" ? (
                    <span className="text-lg font-black text-white">{fixture.score}</span>
                  ) : (
                    <span className="text-lg font-black text-accent">VS</span>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-start gap-3 text-left">
                  <div className="h-8 w-8 rounded-full bg-field border border-subtle flex items-center justify-center text-muted shrink-0">
                    <Shield size={16} />
                  </div>
                  <span className="text-sm font-bold text-white whitespace-nowrap">{fixture.teamB}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button type="button" className="px-6 py-2 text-xs font-bold uppercase rounded bg-field border border-subtle text-muted hover:text-white transition-colors">
            View Full Fixtures
          </button>
        </div>
      </div>
    </section>
  );
}
