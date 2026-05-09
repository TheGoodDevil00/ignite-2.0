import { createClient } from "@/lib/supabase/server";
import { ScoresAdminClient, type ScoreAdminRow } from "./ScoresAdminClient";

export const dynamic = "force-dynamic";

type RawScoreMatch = {
  id: number;
  match_number: number;
  status: "scheduled" | "live";
  estimated_start: string | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
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
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        match_scores(home_score, away_score)
      `
    )
    .in("status", ["scheduled", "live"])
    .eq("is_bye", false)
    .order("estimated_start", { ascending: true, nullsFirst: false });

  const matches: ScoreAdminRow[] = ((data ?? []) as unknown as RawScoreMatch[]).map(
    (match) => ({
      id: match.id,
      matchNumber: match.match_number,
      status: match.status,
      estimatedStart: match.estimated_start,
      homeTeam: match.home_team?.name ?? "TBD",
      awayTeam: match.away_team?.name ?? "TBD",
      ...getScore(match.match_scores),
    })
  );

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
