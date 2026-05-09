"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { saveMatchScore } from "@/app/admin/actions";

export type ScoreAdminRow = {
  id: number;
  matchNumber: number;
  status: "scheduled" | "live";
  estimatedStart: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
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

export function ScoresAdminClient({ matches }: { matches: ScoreAdminRow[] }) {
  const [rows, setRows] = useState(matches);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();

  function updateScore(id: number, patch: Partial<ScoreAdminRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function save(row: ScoreAdminRow) {
    startTransition(async () => {
      const result = await saveMatchScore(row.id, row.homeScore, row.awayScore);
      setMessages((current) => ({ ...current, [row.id]: result.message }));
      if (result.ok) {
        setRows((current) => current.filter((item) => item.id !== row.id));
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-subtle bg-card p-8 text-center">
        <p className="font-black uppercase text-white">No scheduled or live matches</p>
        <p className="mt-2 text-sm text-muted">Completed and cancelled matches are hidden here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <article className="rounded-lg border border-subtle bg-card p-4 shadow-glass" key={row.id}>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-field px-2 py-1 text-[10px] font-black uppercase text-accent">
                  Match #{row.matchNumber}
                </span>
                <span className="rounded bg-field px-2 py-1 text-[10px] font-black uppercase text-muted">
                  {row.status}
                </span>
                <span className="text-xs font-semibold uppercase text-muted">
                  {formatStart(row.estimatedStart)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <p className="text-lg font-black text-white">{row.homeTeam}</p>
                <span className="text-center text-xs font-black uppercase text-muted">vs</span>
                <p className="text-lg font-black text-white sm:text-right">{row.awayTeam}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                className="form-input h-12 w-24 text-center text-lg font-black"
                type="number"
                min={0}
                value={row.homeScore}
                onChange={(event) =>
                  updateScore(row.id, { homeScore: Number(event.target.value) })
                }
                aria-label={`${row.homeTeam} score`}
              />
              <span className="font-black text-muted">-</span>
              <input
                className="form-input h-12 w-24 text-center text-lg font-black"
                type="number"
                min={0}
                value={row.awayScore}
                onChange={(event) =>
                  updateScore(row.id, { awayScore: Number(event.target.value) })
                }
                aria-label={`${row.awayTeam} score`}
              />
              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded bg-accent px-4 text-xs font-bold uppercase text-white disabled:opacity-60"
                disabled={isPending}
                onClick={() => save(row)}
              >
                <CheckCircle2 size={16} />
                Save
              </button>
            </div>
          </div>
          {messages[row.id] ? (
            <p className="mt-3 text-sm font-semibold text-muted">{messages[row.id]}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
