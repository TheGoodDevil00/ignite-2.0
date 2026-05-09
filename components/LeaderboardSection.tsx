"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type TeamStats = {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
};

export function LeaderboardSection({ visible }: { visible?: boolean }) {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTeams, setNoTeams] = useState(false);
  const [error, setError] = useState(false);

  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    []
  );

  useEffect(() => {
    if (!visible || !supabase) return;

    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const { data: teamsData, error: teamsError } = await supabase!.from("teams").select("id, name");
        if (cancelled) return;
        if (teamsError) throw teamsError;

        if (!teamsData || teamsData.length === 0) {
          setNoTeams(true);
          setLoading(false);
          return;
        }
        setNoTeams(false);

        const { data: matchesData, error: matchesError } = await supabase!.from("matches").select(`
          home_team_id, away_team_id,
          match_scores(home_score, away_score)
        `).eq("status", "completed");
        
        if (cancelled) return;
        if (matchesError) throw matchesError;

        const teamStatsMap = new Map<number, TeamStats>();
        for (const t of teamsData) {
          teamStatsMap.set(t.id, {
            id: t.id,
            name: t.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0,
          });
        }

        for (const m of matchesData || []) {
          if (!m.match_scores) continue;
          const score = Array.isArray(m.match_scores) ? m.match_scores[0] : m.match_scores;
          if (!score) continue;

          const hId = m.home_team_id;
          const aId = m.away_team_id;

          if (hId && teamStatsMap.has(hId)) {
            const s = teamStatsMap.get(hId)!;
            s.played++;
            s.goalsFor += score.home_score;
            s.goalsAgainst += score.away_score;
            if (score.home_score > score.away_score) {
              s.won++;
              s.points += 3;
            } else if (score.home_score < score.away_score) {
              s.lost++;
            } else {
              s.drawn++;
              s.points += 1;
            }
          }

          if (aId && teamStatsMap.has(aId)) {
            const s = teamStatsMap.get(aId)!;
            s.played++;
            s.goalsFor += score.away_score;
            s.goalsAgainst += score.home_score;
            if (score.away_score > score.home_score) {
              s.won++;
              s.points += 3;
            } else if (score.away_score < score.home_score) {
              s.lost++;
            } else {
              s.drawn++;
              s.points += 1;
            }
          }
        }

        const sortedTeams = Array.from(teamStatsMap.values()).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const gdA = a.goalsFor - a.goalsAgainst;
          const gdB = b.goalsFor - b.goalsAgainst;
          if (gdB !== gdA) return gdB - gdA;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return a.name.localeCompare(b.name);
        });

        setTeams(sortedTeams);
        setError(false);
      } catch (err) {
        console.error("Leaderboard error:", err);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLeaderboard();

    const channel = supabase!
      .channel("public-leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => loadLeaderboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => loadLeaderboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "match_scores" }, () => loadLeaderboard())
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [visible, supabase]);

  if (!visible) return null;

  const hasMatchesPlayed = teams.some(t => t.played > 0);

  return (
    <section id="leaderboard" className="section-band bg-primary">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="content-heading">LEADERBOARD</h2>
        </div>

        {loading ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-subtle bg-card p-6 shadow-glass backdrop-blur">
             <div className="flex flex-col gap-4">
                <div className="h-10 w-full animate-pulse rounded bg-muted/10"></div>
                <div className="h-10 w-full animate-pulse rounded bg-muted/10"></div>
                <div className="h-10 w-full animate-pulse rounded bg-muted/10"></div>
                <div className="h-10 w-full animate-pulse rounded bg-muted/10"></div>
             </div>
          </div>
        ) : error ? (
          <div className="mt-8 text-center text-muted">
            Unable to load data
          </div>
        ) : noTeams ? (
          <div className="mt-8 text-center text-muted py-8">
            No teams registered yet.
          </div>
        ) : !hasMatchesPlayed ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-subtle bg-card p-12 text-center text-muted shadow-glass backdrop-blur">
            Standings will appear once matches begin
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-subtle bg-card shadow-glass backdrop-blur">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-field text-xs uppercase text-muted">
                <tr>
                  <th className="sticky left-0 bg-field px-4 py-3 z-10 w-[64px] min-w-[64px]">Rank</th>
                  <th className="sticky left-[64px] bg-field px-4 py-3 z-10 min-w-[160px] shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">Team</th>
                  <th className="px-4 py-3 text-center">Points</th>
                  <th className="px-4 py-3 text-center">Played</th>
                  <th className="px-4 py-3 text-center">Won</th>
                  <th className="px-4 py-3 text-center">Draw</th>
                  <th className="px-4 py-3 text-center">Lost</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Goals For</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Goals Against</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((row, index) => {
                  const rank = index + 1;
                  return (
                    <tr className="border-t border-subtle bg-card even:bg-white/[0.02] transition-colors hover:bg-white/[0.05]" key={row.id}>
                      <td className={`sticky left-0 px-4 py-3 font-bold z-10 w-[64px] min-w-[64px] bg-inherit ${rank === 1 ? 'text-accent' : 'text-text'}`}>#{rank}</td>
                      <td className="sticky left-[64px] px-4 py-3 font-semibold text-white z-10 min-w-[160px] bg-inherit shadow-[1px_0_0_0_rgba(255,255,255,0.05)] whitespace-nowrap">{row.name}</td>
                      <td className="px-4 py-3 text-center font-black text-white bg-inherit">{row.points}</td>
                      <td className="px-4 py-3 text-center text-muted bg-inherit">{row.played}</td>
                      <td className="px-4 py-3 text-center text-muted bg-inherit">{row.won}</td>
                      <td className="px-4 py-3 text-center text-muted bg-inherit">{row.drawn}</td>
                      <td className="px-4 py-3 text-center text-muted bg-inherit">{row.lost}</td>
                      <td className="px-4 py-3 text-center text-muted bg-inherit">{row.goalsFor}</td>
                      <td className="px-4 py-3 text-center text-muted bg-inherit">{row.goalsAgainst}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
