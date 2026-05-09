"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import {
  fixtures as fallbackFixtures,
  type FixtureStatus as BaseFixtureStatus,
} from "@/lib/mockData";
import { createClient } from "@/lib/supabase/client";

type FixtureStatus = BaseFixtureStatus | "cancelled";

type Fixture = {
  id: number;
  matchNumber: number;
  teamA: string;
  teamB: string;
  time: string;
  status: FixtureStatus;
  score: string;
};

type RawFixture = {
  id: number;
  match_number: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  estimated_start: string | null;
  is_bye: boolean;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  bye_team: { name: string } | null;
  match_scores: { home_score: number; away_score: number } | null | Array<{
    home_score: number;
    away_score: number;
  }>;
};

const filterOptions: Array<{ value: FixtureStatus | "all"; label: string }> = [
  { value: "all", label: "All Matches" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
];

const statusLabels: Record<FixtureStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

function mapStatus(status: RawFixture["status"]): FixtureStatus {
  if (status === "scheduled") return "upcoming";
  return status;
}

function formatTime(value: string | null) {
  if (!value) return "Time TBD";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeScore(raw: RawFixture["match_scores"]) {
  const score = Array.isArray(raw) ? raw[0] : raw;
  return score ? `${score.home_score} - ${score.away_score}` : "-";
}

function fallbackRows(): Fixture[] {
  return fallbackFixtures.map((fixture) => ({
    id: fixture.id,
    matchNumber: fixture.id,
    teamA: fixture.teamA,
    teamB: fixture.teamB,
    time: fixture.time,
    status: fixture.status,
    score: fixture.score,
  }));
}

function mapFixture(match: RawFixture): Fixture {
  const status = mapStatus(match.status);
  return {
    id: match.id,
    matchNumber: match.match_number,
    teamA: match.is_bye
      ? match.bye_team?.name ?? match.home_team?.name ?? "Bye"
      : match.home_team?.name ?? "TBD",
    teamB: match.is_bye ? "BYE" : match.away_team?.name ?? "TBD",
    time: formatTime(match.estimated_start),
    status,
    score: status === "upcoming" ? "-" : normalizeScore(match.match_scores),
  };
}

export function FixturesSection() {
  const [filter, setFilter] = useState<FixtureStatus | "all">("all");
  const [fixtures, setFixtures] = useState<Fixture[]>(fallbackRows);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadFixtures() {
      const { data } = await supabase
        .from("matches")
        .select(
          `
            id,
            match_number,
            status,
            estimated_start,
            is_bye,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name),
            bye_team:teams!matches_bye_team_id_fkey(name),
            match_scores(home_score, away_score)
          `
        )
        .order("estimated_start", { ascending: true, nullsFirst: false });

      if (cancelled || !data) return;
      setFixtures(((data ?? []) as unknown as RawFixture[]).map(mapFixture));
    }

    loadFixtures();

    const channel = supabase
      .channel("public-fixtures")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => loadFixtures()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_scores" },
        () => loadFixtures()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredFixtures = fixtures.filter(
    (fixture) => filter === "all" || fixture.status === filter
  );

  return (
    <section id="fixtures" className="section-band bg-section">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="content-heading">Fixtures</h2>
        </div>

        <div className="mb-8 mt-8 flex flex-wrap justify-center gap-2">
          {filterOptions.map((option) => (
            <button
              onClick={() => setFilter(option.value)}
              className={`rounded-sm border border-subtle px-6 py-2 text-xs font-bold uppercase transition-colors ${
                filter === option.value
                  ? "border-accent bg-accent text-white"
                  : "bg-card text-muted hover:text-white"
              }`}
              key={option.value}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mx-auto grid max-w-4xl gap-3">
          {filteredFixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="flex flex-col items-center gap-4 rounded-lg border border-subtle bg-card p-4 transition-colors hover:border-muted/30 sm:flex-row"
            >
              <div className="w-full shrink-0 text-center sm:w-48 sm:text-left">
                <p className="text-sm font-bold uppercase text-white">
                  Match {fixture.matchNumber < 10 ? `0${fixture.matchNumber}` : fixture.matchNumber}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted">{fixture.time}</p>
                <p className="mt-1 text-[10px] font-black uppercase text-muted">
                  {statusLabels[fixture.status]}
                </p>
              </div>

              <div className="flex w-full flex-1 items-center justify-center gap-2 sm:gap-8">
                <div className="flex flex-1 items-center justify-end gap-2 text-right">
                  <span className="text-xs font-bold text-white sm:text-sm">{fixture.teamA}</span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-subtle bg-field text-muted">
                    <Shield size={16} />
                  </div>
                </div>

                <div className="flex w-16 shrink-0 items-center justify-center">
                  {fixture.status === "live" ? (
                    <span className="text-lg font-black text-accent">{fixture.score}</span>
                  ) : fixture.status === "completed" ? (
                    <span className="text-lg font-black text-white">{fixture.score}</span>
                  ) : fixture.status === "cancelled" ? (
                    <span className="text-xs font-black uppercase text-muted">Off</span>
                  ) : (
                    <span className="text-lg font-black text-accent">VS</span>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-start gap-2 text-left">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-subtle bg-field text-muted">
                    <Shield size={16} />
                  </div>
                  <span className="text-xs font-bold text-white sm:text-sm">{fixture.teamB}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            className="rounded border border-subtle bg-field px-6 py-2 text-xs font-bold uppercase text-muted transition-colors hover:text-white"
          >
            View Full Fixtures
          </button>
        </div>
      </div>
    </section>
  );
}
