"use client";

import { useMemo, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateMatchDetails } from "@/app/admin/actions";
import type { MatchStatus } from "@/lib/supabase/types";

export type FixtureAdminRow = {
  id: number;
  matchNumber: number;
  status: MatchStatus;
  estimatedStart: string | null;
  venueDetail: string | null;
  isBye: boolean;
  homeTeam: string;
  awayTeam: string;
  roundName: string;
  score: string;
};

const statusOptions: MatchStatus[] = ["scheduled", "live", "completed", "cancelled"];

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function FixturesAdminClient({ fixtures }: { fixtures: FixtureAdminRow[] }) {
  const [rows, setRows] = useState(fixtures);
  const [roundFilter, setRoundFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();

  const rounds = useMemo(
    () => Array.from(new Set(rows.map((row) => row.roundName))).sort(),
    [rows]
  );

  const filteredRows = rows.filter((row) => {
    const matchesRound = roundFilter === "all" || row.roundName === roundFilter;
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesRound && matchesStatus;
  });

  function updateLocalRow(id: number, patch: Partial<FixtureAdminRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function save(row: FixtureAdminRow) {
    startTransition(async () => {
      const result = await updateMatchDetails(row.id, {
        estimatedStart: toDateTimeLocal(row.estimatedStart),
        venueDetail: row.venueDetail ?? "",
        status: row.status,
      });

      setMessages((current) => ({
        ...current,
        [row.id]: result.message,
      }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-lg border border-subtle bg-card p-4">
        <select
          className="form-input w-auto min-w-40"
          value={roundFilter}
          onChange={(event) => setRoundFilter(event.target.value)}
        >
          <option value="all">All rounds</option>
          {rounds.map((round) => (
            <option value={round} key={round}>
              {round}
            </option>
          ))}
        </select>

        <select
          className="form-input w-auto min-w-40"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as MatchStatus | "all")}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-subtle bg-card shadow-glass">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-field text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Teams</th>
              <th className="px-4 py-3">Round</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3 text-right">Save</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr className="border-t border-subtle align-top" key={row.id}>
                <td className="px-4 py-4 font-black text-accent">#{row.matchNumber}</td>
                <td className="px-4 py-4">
                  <p className="font-bold text-white">{row.homeTeam}</p>
                  <p className="mt-1 text-xs uppercase text-muted">
                    {row.isBye ? "Bye" : `vs ${row.awayTeam}`}
                  </p>
                </td>
                <td className="px-4 py-4 text-muted">{row.roundName}</td>
                <td className="px-4 py-4">
                  <input
                    className="form-input min-w-48"
                    type="datetime-local"
                    value={toDateTimeLocal(row.estimatedStart)}
                    onChange={(event) =>
                      updateLocalRow(row.id, {
                        estimatedStart: event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </td>
                <td className="px-4 py-4">
                  <input
                    className="form-input min-w-44"
                    value={row.venueDetail ?? ""}
                    onChange={(event) =>
                      updateLocalRow(row.id, { venueDetail: event.target.value })
                    }
                  />
                </td>
                <td className="px-4 py-4">
                  <select
                    className="form-input min-w-36"
                    value={row.status}
                    onChange={(event) =>
                      updateLocalRow(row.id, {
                        status: event.target.value as MatchStatus,
                      })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4 font-black text-white">{row.score}</td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded bg-accent px-3 py-2 text-xs font-bold uppercase text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => save(row)}
                  >
                    <Save size={14} />
                    Save
                  </button>
                  {messages[row.id] ? (
                    <p className="mt-2 text-xs font-semibold text-muted">{messages[row.id]}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
