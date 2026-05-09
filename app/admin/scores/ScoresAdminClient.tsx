"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ListChecks,
  RadioTower,
} from "lucide-react";
import type { MatchStatus } from "@/lib/supabase/types";

export type ScoreAdminRow = {
  id: number;
  matchNumber: number;
  status: MatchStatus;
  estimatedStart: string | null;
  roundName: string;
  roundNumber: number;
  homeTeam: string;
  homeTeamId: number | null;
  homeEliminated: boolean;
  awayTeam: string;
  awayTeamId: number | null;
  awayEliminated: boolean;
  winnerName: string | null;
  homeScore: number;
  awayScore: number;
};

type RoundGroup = {
  key: string;
  name: string;
  roundNumber: number;
  matches: ScoreAdminRow[];
};

const badgeStyles: Record<MatchStatus, string> = {
  scheduled: "border-white/15 bg-white/10 text-muted",
  live: "border-amber-300/40 bg-amber-300/15 text-amber-200",
  completed: "border-emerald-300/40 bg-emerald-300/15 text-emerald-200",
  cancelled: "border-white/10 bg-white/5 text-muted",
};

function formatStart(value: string | null) {
  if (!value) return "Time TBD";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function TeamName({
  eliminated,
  name,
  align,
}: {
  eliminated: boolean;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <span
      className={`block break-words text-sm font-black ${
        eliminated ? "text-muted line-through decoration-white/40" : "text-white"
      } ${align === "right" ? "sm:text-right" : ""}`}
    >
      {name}
    </span>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-1 text-[10px] font-black uppercase ${badgeStyles[status]}`}
    >
      {status}
    </span>
  );
}

function groupRows(rows: ScoreAdminRow[]): RoundGroup[] {
  const groups = new Map<string, RoundGroup>();

  for (const row of rows) {
    const key = `${row.roundNumber}:${row.roundName}`;
    const existing = groups.get(key);

    if (existing) {
      existing.matches.push(row);
    } else {
      groups.set(key, {
        key,
        name: row.roundName,
        roundNumber: row.roundNumber,
        matches: [row],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
    return a.name.localeCompare(b.name);
  });
}

export function ScoresAdminClient({ matches }: { matches: ScoreAdminRow[] }) {
  const groups = useMemo(() => groupRows(matches), [matches]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  function toggleRound(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-subtle bg-card p-8 text-center">
        <p className="font-black uppercase text-white">No matches found</p>
        <p className="mt-2 text-sm text-muted">Generate fixtures before scoring.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.key);
        const liveCount = group.matches.filter((match) => match.status === "live").length;
        const completedCount = group.matches.filter(
          (match) => match.status === "completed"
        ).length;
        const ToggleIcon = isCollapsed ? ChevronRight : ChevronDown;

        return (
          <section className="overflow-hidden rounded-lg border border-subtle bg-card shadow-glass" key={group.key}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 bg-field px-4 py-4 text-left"
              onClick={() => toggleRound(group.key)}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-accent">
                  Round {group.roundNumber}
                </p>
                <h2 className="mt-1 break-words text-xl font-black uppercase text-white">
                  {group.name}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {liveCount > 0 ? (
                  <span className="hidden items-center gap-1 rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-black uppercase text-amber-200 sm:inline-flex">
                    <RadioTower size={12} />
                    {liveCount} live
                  </span>
                ) : null}
                <span className="hidden rounded border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-200 sm:inline-flex">
                  {completedCount}/{group.matches.length} done
                </span>
                <ToggleIcon size={18} className="text-muted" />
              </div>
            </button>

            {!isCollapsed ? (
              <div className="divide-y divide-subtle">
                {group.matches.map((row) => (
                  <article className="p-4" key={row.id}>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-field px-2 py-1 text-[10px] font-black uppercase text-accent">
                            Match #{row.matchNumber}
                          </span>
                          <StatusBadge status={row.status} />
                          <span className="text-xs font-semibold uppercase text-muted">
                            {formatStart(row.estimatedStart)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                          <TeamName name={row.homeTeam} eliminated={row.homeEliminated} />
                          <div className="flex items-center justify-center gap-3">
                            {row.status === "completed" || row.status === "live" ? (
                              <span className="font-display text-4xl italic leading-none text-white">
                                {row.homeScore} - {row.awayScore}
                              </span>
                            ) : (
                              <span className="text-xs font-black uppercase text-muted">vs</span>
                            )}
                          </div>
                          <TeamName
                            name={row.awayTeam}
                            eliminated={row.awayEliminated}
                            align="right"
                          />
                        </div>

                        {row.status === "completed" && row.winnerName ? (
                          <div className="mt-3 inline-flex items-center gap-2 rounded border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase text-emerald-200">
                            <Check size={14} />
                            {row.winnerName}
                          </div>
                        ) : null}
                      </div>

                      <Link
                        href={`/admin/scores/${row.id}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded bg-accent px-4 text-xs font-black uppercase text-white transition hover:shadow-glow"
                      >
                        <ListChecks size={16} />
                        Score
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
