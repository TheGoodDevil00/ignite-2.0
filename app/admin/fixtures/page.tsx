import { createClient } from "@/lib/supabase/server";
import { FixturesAdminClient, type FixtureAdminRow } from "./FixturesAdminClient";
import { RunFixtureGeneratorButton } from "./RunFixtureGeneratorButton";

export const dynamic = "force-dynamic";

type RawFixture = {
  id: number;
  match_number: number;
  status: FixtureAdminRow["status"];
  estimated_start: string | null;
  venue_detail: string | null;
  is_bye: boolean;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  bye_team: { name: string } | null;
  round: { name: string } | null;
  match_scores: { home_score: number; away_score: number } | null | Array<{
    home_score: number;
    away_score: number;
  }>;
};

function normalizeScore(raw: RawFixture["match_scores"]) {
  const score = Array.isArray(raw) ? raw[0] : raw;
  return score ? `${score.home_score} - ${score.away_score}` : "-";
}

export default async function AdminFixturesPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        id,
        match_number,
        status,
        estimated_start,
        venue_detail,
        is_bye,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        bye_team:teams!matches_bye_team_id_fkey(name),
        round:rounds(name),
        match_scores(home_score, away_score)
      `
    )
    .order("estimated_start", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const fixtures: FixtureAdminRow[] = ((data ?? []) as unknown as RawFixture[]).map(
    (match) => ({
      id: match.id,
      matchNumber: match.match_number,
      status: match.status,
      estimatedStart: match.estimated_start,
      venueDetail: match.venue_detail,
      isBye: match.is_bye,
      homeTeam: match.is_bye
        ? match.bye_team?.name ?? match.home_team?.name ?? "Bye"
        : match.home_team?.name ?? "TBD",
      awayTeam: match.away_team?.name ?? "TBD",
      roundName: match.round?.name ?? "Unassigned",
      score: normalizeScore(match.match_scores),
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase text-muted">Schedule control</p>
        <h1 className="mt-2 text-3xl font-black uppercase text-white">Fixtures</h1>
      </div>

      {profile?.role === "admin" ? <RunFixtureGeneratorButton /> : null}
      <FixturesAdminClient fixtures={fixtures} />
    </div>
  );
}
