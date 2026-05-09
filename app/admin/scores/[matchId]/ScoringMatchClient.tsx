"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Flag,
  Minus,
  Plus,
  RadioTower,
  Shield,
  X,
} from "lucide-react";
import {
  completeMatch,
  markMatchLive,
  updatePlayerMatchStat,
  type StatName,
} from "@/app/actions/scoring";
import { createClient } from "@/lib/supabase/client";
import type { MatchStatus } from "@/lib/supabase/types";

export type ScoringTeam = {
  id: number | null;
  name: string;
};

export type ScoringMatch = {
  id: number;
  matchNumber: number;
  roundName: string;
  status: MatchStatus;
  homeTeam: ScoringTeam;
  awayTeam: ScoringTeam;
  homeScore: number;
  awayScore: number;
};

export type ScoringPlayer = {
  id: number;
  name: string;
  jerseyNumber: number | null;
  teamId: number;
  goals: number;
  saves: number;
};

type TeamPanelProps = {
  align: "left" | "right";
  canEdit: boolean;
  pendingStats: Record<string, boolean>;
  players: ScoringPlayer[];
  score: number;
  team: ScoringTeam;
  onAdjust: (player: ScoringPlayer, stat: StatName, delta: number) => void;
};

type CounterControlsProps = {
  count: number;
  disabled: boolean;
  label: string;
  minusDisabled: boolean;
  pending: boolean;
  onChange: (delta: number) => void;
};

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
};

type RawStat = {
  player_id: number;
  goals: number;
  saves: number;
};

type RawScore = {
  home_score: number;
  away_score: number;
};

type RawStatus = {
  status: MatchStatus;
};

const statusStyles: Record<MatchStatus, string> = {
  scheduled: "border-white/15 bg-white/10 text-muted",
  live: "border-amber-300/40 bg-amber-300/15 text-amber-200",
  completed: "border-emerald-300/40 bg-emerald-300/15 text-emerald-200",
  cancelled: "border-white/10 bg-white/5 text-muted",
};

function statKey(playerId: number, stat: StatName) {
  return `${playerId}:${stat}`;
}

function getJerseyLabel(value: number | null) {
  return value === null ? "--" : `#${String(value).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-3 py-1 text-[10px] font-black uppercase ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-subtle bg-nav p-4 text-sm font-semibold text-white shadow-glass">
      <span className="leading-6">{message}</span>
      <button
        type="button"
        className="icon-button h-7 w-7 shrink-0"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-subtle bg-primary p-5 shadow-glass">
        <div className="flex justify-end">
          <button
            type="button"
            className="icon-button h-8 w-8"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CounterControls({
  count,
  disabled,
  label,
  minusDisabled,
  pending,
  onChange,
}: CounterControlsProps) {
  return (
    <div className="grid min-w-[116px] grid-cols-[32px_1fr_32px] items-center gap-2">
      <button
        type="button"
        className="icon-button h-8 w-8 rounded disabled:opacity-35"
        disabled={disabled || minusDisabled || pending}
        onClick={() => onChange(-1)}
        aria-label={`Decrease ${label}`}
      >
        <Minus size={14} />
      </button>
      <div className="rounded border border-subtle bg-field px-2 py-1 text-center">
        <p className="text-[9px] font-black uppercase text-muted">{label}</p>
        <p className="text-lg font-black leading-none text-white">{count}</p>
      </div>
      <button
        type="button"
        className="icon-button h-8 w-8 rounded disabled:opacity-35"
        disabled={disabled || pending}
        onClick={() => onChange(1)}
        aria-label={`Increase ${label}`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function TeamPanel({
  align,
  canEdit,
  pendingStats,
  players,
  score,
  team,
  onAdjust,
}: TeamPanelProps) {
  const totalGoals = players.reduce((sum, player) => sum + player.goals, 0);

  return (
    <section className="rounded-lg border border-subtle bg-card p-4 shadow-glass">
      <div className={`flex items-start justify-between gap-4 ${align === "right" ? "xl:flex-row-reverse xl:text-right" : ""}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-muted">
            {align === "left" ? "Home" : "Away"}
          </p>
          <h2 className="mt-1 break-words text-2xl font-black uppercase text-white sm:text-3xl">
            {team.name}
          </h2>
        </div>
        <div className="shrink-0 text-center">
          <p className="text-[10px] font-black uppercase text-muted">Score</p>
          <p className="font-display text-6xl italic leading-none text-accent">{score}</p>
        </div>
      </div>

      <div className="mt-5 max-h-[52vh] overflow-y-auto pr-1">
        {players.length === 0 ? (
          <div className="rounded border border-subtle bg-field p-4 text-sm font-semibold text-muted">
            Roster TBD
          </div>
        ) : (
          <div className="grid gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="grid gap-3 rounded border border-subtle bg-field p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-accent">
                    {getJerseyLabel(player.jerseyNumber)}
                  </p>
                  <p className="truncate text-sm font-bold text-white">{player.name}</p>
                </div>
                <div className="grid gap-2 xs:grid-cols-2">
                  <CounterControls
                    count={player.goals}
                    disabled={!canEdit}
                    label="Goals"
                    minusDisabled={player.goals <= 0}
                    pending={Boolean(pendingStats[statKey(player.id, "goals")])}
                    onChange={(delta) => onAdjust(player, "goals", delta)}
                  />
                  <CounterControls
                    count={player.saves}
                    disabled={!canEdit}
                    label="Saves"
                    minusDisabled={player.saves <= 0}
                    pending={Boolean(pendingStats[statKey(player.id, "saves")])}
                    onChange={(delta) => onAdjust(player, "saves", delta)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded border border-subtle bg-field px-4 py-3">
        <span className="text-xs font-black uppercase text-muted">Goal Total</span>
        <span className="text-2xl font-black text-white">{totalGoals}</span>
      </div>
    </section>
  );
}

export function MatchScoringClient({
  initialMatch,
  initialPlayers,
}: {
  initialMatch: ScoringMatch;
  initialPlayers: ScoringPlayer[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [matchState, setMatchState] = useState(initialMatch);
  const [players, setPlayers] = useState(initialPlayers);
  const [pendingStats, setPendingStats] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tiebreakerOpen, setTiebreakerOpen] = useState(false);
  const [isLivePending, startLiveTransition] = useTransition();
  const [isCompletePending, startCompleteTransition] = useTransition();

  const homePlayers = useMemo(
    () => players.filter((player) => player.teamId === matchState.homeTeam.id),
    [players, matchState.homeTeam.id]
  );
  const awayPlayers = useMemo(
    () => players.filter((player) => player.teamId === matchState.awayTeam.id),
    [players, matchState.awayTeam.id]
  );
  const homeScore = useMemo(
    () => homePlayers.reduce((sum, player) => sum + player.goals, 0),
    [homePlayers]
  );
  const awayScore = useMemo(
    () => awayPlayers.reduce((sum, player) => sum + player.goals, 0),
    [awayPlayers]
  );
  const canEditStats =
    matchState.status === "scheduled" || matchState.status === "live";
  const canComplete =
    matchState.status === "live" &&
    matchState.homeTeam.id !== null &&
    matchState.awayTeam.id !== null;

  const loadSnapshot = useCallback(async () => {
    const [statsResult, scoreResult, statusResult] = await Promise.all([
      supabase
        .from("player_match_stats")
        .select("player_id,goals,saves")
        .eq("match_id", matchState.id),
      supabase
        .from("match_scores")
        .select("home_score,away_score")
        .eq("match_id", matchState.id)
        .maybeSingle(),
      supabase
        .from("matches")
        .select("status")
        .eq("id", matchState.id)
        .maybeSingle(),
    ]);

    if (statsResult.error || scoreResult.error || statusResult.error) {
      setToast("Failed to sync live stats.");
      return;
    }

    const statsByPlayer = new Map<number, RawStat>(
      ((statsResult.data ?? []) as RawStat[]).map((stat) => [stat.player_id, stat])
    );
    const score = scoreResult.data as RawScore | null;
    const status = statusResult.data as RawStatus | null;

    setPlayers((current) =>
      current.map((player) => {
        const stat = statsByPlayer.get(player.id);
        return {
          ...player,
          goals: stat?.goals ?? 0,
          saves: stat?.saves ?? 0,
        };
      })
    );
    setMatchState((current) => ({
      ...current,
      status: status?.status ?? current.status,
      homeScore: score?.home_score ?? current.homeScore,
      awayScore: score?.away_score ?? current.awayScore,
    }));
  }, [matchState.id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-scoring-${matchState.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_match_stats",
          filter: `match_id=eq.${matchState.id}`,
        },
        () => {
          void loadSnapshot();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_scores",
          filter: `match_id=eq.${matchState.id}`,
        },
        () => {
          void loadSnapshot();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchState.id}`,
        },
        () => {
          void loadSnapshot();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSnapshot, matchState.id, supabase]);

  function adjustLocalScore(player: ScoringPlayer, delta: number) {
    setMatchState((current) => {
      if (player.teamId === current.homeTeam.id) {
        return { ...current, homeScore: Math.max(current.homeScore + delta, 0) };
      }

      if (player.teamId === current.awayTeam.id) {
        return { ...current, awayScore: Math.max(current.awayScore + delta, 0) };
      }

      return current;
    });
  }

  async function adjustStat(player: ScoringPlayer, stat: StatName, delta: number) {
    const currentCount = player[stat];
    const nextCount = Math.max(currentCount + delta, 0);
    const appliedDelta = nextCount - currentCount;

    if (appliedDelta === 0) {
      return;
    }

    const key = statKey(player.id, stat);
    setPendingStats((current) => ({ ...current, [key]: true }));
    setPlayers((current) =>
      current.map((item) =>
        item.id === player.id
          ? {
              ...item,
              goals: stat === "goals" ? nextCount : item.goals,
              saves: stat === "saves" ? nextCount : item.saves,
            }
          : item
      )
    );

    if (stat === "goals") {
      adjustLocalScore(player, appliedDelta);
    }

    const result = await updatePlayerMatchStat({
      matchId: matchState.id,
      playerId: player.id,
      stat,
      delta,
    });

    setPendingStats((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });

    if (!result.ok) {
      setToast(result.message);
      await loadSnapshot();
      return;
    }

    setPlayers((current) =>
      current.map((item) =>
        item.id === player.id
          ? {
              ...item,
              goals: result.goals ?? item.goals,
              saves: result.saves ?? item.saves,
            }
          : item
      )
    );
    setMatchState((current) => ({
      ...current,
      homeScore: result.homeScore ?? current.homeScore,
      awayScore: result.awayScore ?? current.awayScore,
    }));
  }

  function handleMarkLive() {
    startLiveTransition(async () => {
      const result = await markMatchLive(matchState.id);

      if (!result.ok) {
        setToast(result.message);
        return;
      }

      setMatchState((current) => ({ ...current, status: "live" }));
    });
  }

  function submitCompletion(winnerId: number) {
    startCompleteTransition(async () => {
      const result = await completeMatch(matchState.id, winnerId);

      if (!result.ok) {
        setToast(result.message);
        return;
      }

      router.push("/admin/scores");
      router.refresh();
    });
  }

  function handleConfirmComplete() {
    if (homeScore === awayScore) {
      setConfirmOpen(false);
      setTiebreakerOpen(true);
      return;
    }

    const winnerId =
      homeScore > awayScore ? matchState.homeTeam.id : matchState.awayTeam.id;

    if (!winnerId) {
      setToast("Winner could not be determined.");
      return;
    }

    submitCompletion(winnerId);
  }

  return (
    <div className="space-y-5 pb-28 lg:pb-6">
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-muted">Live score desk</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-white">
            Match #{matchState.matchNumber}
          </h1>
        </div>
        <StatusBadge status={matchState.status} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)] xl:items-start">
        <TeamPanel
          align="left"
          canEdit={canEditStats}
          pendingStats={pendingStats}
          players={homePlayers}
          score={homeScore}
          team={matchState.homeTeam}
          onAdjust={adjustStat}
        />

        <aside className="order-2 rounded-lg border border-subtle bg-nav p-5 text-center shadow-glass xl:order-none xl:sticky xl:top-6">
          <p className="text-[10px] font-black uppercase text-muted">
            Match #{matchState.matchNumber}
          </p>
          <p className="mt-1 text-sm font-black uppercase text-white">
            {matchState.roundName}
          </p>
          <div className="my-6 flex items-center justify-center gap-3">
            <span className="h-px flex-1 bg-subtle" />
            <span className="font-display text-4xl italic text-accent">VS</span>
            <span className="h-px flex-1 bg-subtle" />
          </div>
          <p className="font-display text-6xl italic leading-none text-white">
            {homeScore} - {awayScore}
          </p>
          <div className="mt-5 flex justify-center">
            <StatusBadge status={matchState.status} />
          </div>
        </aside>

        <TeamPanel
          align="right"
          canEdit={canEditStats}
          pendingStats={pendingStats}
          players={awayPlayers}
          score={awayScore}
          team={matchState.awayTeam}
          onAdjust={adjustStat}
        />
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 border-t border-subtle bg-primary/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-lg lg:border lg:bg-card lg:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {matchState.status === "scheduled" ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded bg-field px-4 text-xs font-black uppercase text-white transition hover:text-accent disabled:opacity-60"
              disabled={isLivePending}
              onClick={handleMarkLive}
            >
              <RadioTower size={16} />
              Mark as LIVE
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-accent px-4 text-xs font-black uppercase text-white transition hover:shadow-glow disabled:opacity-45"
            disabled={!canComplete || isCompletePending}
            onClick={() => setConfirmOpen(true)}
          >
            <Flag size={16} />
            Complete Match
          </button>
        </div>
      </div>

      {confirmOpen ? (
        <Modal onClose={() => setConfirmOpen(false)}>
          <div className="text-center">
            <CheckCircle2 size={34} className="mx-auto text-accent" />
            <h2 className="mt-4 text-2xl font-black uppercase text-white">
              End this match?
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">
              {matchState.homeTeam.name} {homeScore} — {awayScore}{" "}
              {matchState.awayTeam.name}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded border border-subtle bg-field px-4 py-3 text-xs font-black uppercase text-muted"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-accent px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                disabled={isCompletePending}
                onClick={handleConfirmComplete}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {tiebreakerOpen ? (
        <Modal onClose={() => setTiebreakerOpen(false)}>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase text-white">
              Pick a tiebreaker winner
            </h2>
            <p className="mt-3 text-sm font-semibold text-muted">
              {homeScore} - {awayScore}
            </p>
            <div className="mt-6 grid gap-3">
              {[matchState.homeTeam, matchState.awayTeam].map((team) => (
                <button
                  key={team.name}
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                  disabled={!team.id || isCompletePending}
                  onClick={() => {
                    if (team.id) {
                      submitCompletion(team.id);
                    }
                  }}
                >
                  <Shield size={16} />
                  {team.name} wins
                </button>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
