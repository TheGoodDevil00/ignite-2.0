import { createClient } from "@/lib/supabase/server";
import { ScoresAdminClient, type ScoreAdminRow } from "./ScoresAdminClient";
import type { MatchStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type RawScoreMatch = {
  id: number;
  match_number: number;
  status: MatchStatus;
  estimated_start: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  winner_id: number | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  winner: { name: string } | null;
  round: { name: string; round_number: number } | null;
  match_scores: { home_score: number; away_score: number } | null | Array<{
    home_score: number;
    away_score: number;
  }>;
};

function getScore(raw: RawScoreMatch["match_scores"]) {
  const score = Array.isArray(raw) ? raw[0] : raw;
  return {
    homeScore: score?.home_score ?? 0,
    awayScore: score?.away_score ?? 0,
  };
}

export default async function AdminScoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      `
        id,
        match_number,
        status,
        estimated_start,
        home_team_id,
        away_team_id,
        winner_id,
        round:rounds(name, round_number),
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        winner:teams!matches_winner_id_fkey(name),
        match_scores(home_score, away_score)
      `
    )
    .eq("is_bye", false)
    .order("match_number", { ascending: true });

  const rawMatches = ((data ?? []) as unknown as RawScoreMatch[]).sort((a, b) => {
    const roundA = a.round?.round_number ?? Number.MAX_SAFE_INTEGER;
    const roundB = b.round?.round_number ?? Number.MAX_SAFE_INTEGER;

    if (roundA !== roundB) return roundA - roundB;
    return a.match_number - b.match_number;
  });

  const eliminatedTeamIds = new Set<number>();

  for (const match of rawMatches) {
    if (match.status !== "completed") continue;

    const { homeScore, awayScore } = getScore(match.match_scores);
    const winnerId =
      match.winner_id ??
      (homeScore > awayScore
        ? match.home_team_id
        : awayScore > homeScore
          ? match.away_team_id
          : null);

    if (!winnerId) continue;

    if (match.home_team_id && match.home_team_id !== winnerId) {
      eliminatedTeamIds.add(match.home_team_id);
    }

    if (match.away_team_id && match.away_team_id !== winnerId) {
      eliminatedTeamIds.add(match.away_team_id);
    }
  }

  const matches: ScoreAdminRow[] = rawMatches.map((match) => {
    const score = getScore(match.match_scores);
    const inferredWinnerName =
      match.winner?.name ??
      (match.status === "completed"
        ? score.homeScore > score.awayScore
          ? match.home_team?.name
          : score.awayScore > score.homeScore
            ? match.away_team?.name
            : null
        : null);

    return {
      id: match.id,
      matchNumber: match.match_number,
      status: match.status,
      estimatedStart: match.estimated_start,
      roundName: match.round?.name ?? "Unassigned",
      roundNumber: match.round?.round_number ?? 999,
      homeTeam: match.home_team?.name ?? "TBD",
      homeTeamId: match.home_team_id,
      homeEliminated: Boolean(
        match.home_team_id && eliminatedTeamIds.has(match.home_team_id)
      ),
      awayTeam: match.away_team?.name ?? "TBD",
      awayTeamId: match.away_team_id,
      awayEliminated: Boolean(
        match.away_team_id && eliminatedTeamIds.has(match.away_team_id)
      ),
      winnerName: inferredWinnerName ?? null,
      ...score,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase text-muted">Live score desk</p>
        <h1 className="mt-2 text-3xl font-black uppercase text-white">Scores</h1>
      </div>

      <ScoresAdminClient matches={matches} />
    </div>
  );
}
