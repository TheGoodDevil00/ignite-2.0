import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/lib/supabase/types";
import {
  MatchScoringClient,
  type ScoringMatch,
  type ScoringPlayer,
} from "./ScoringMatchClient";

export const dynamic = "force-dynamic";

type RawMatch = {
  id: number;
  match_number: number;
  status: MatchStatus;
  home_team_id: number | null;
  away_team_id: number | null;
  is_bye: boolean;
  round: { name: string } | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  match_scores:
    | { home_score: number; away_score: number }
    | null
    | Array<{ home_score: number; away_score: number }>;
};

type RawPlayer = {
  id: number;
  name: string;
  jersey_number: number | null;
  team_id: number;
};

type RawStat = {
  player_id: number;
  goals: number;
  saves: number;
};

function getScore(raw: RawMatch["match_scores"]) {
  const score = Array.isArray(raw) ? raw[0] : raw;
  return {
    homeScore: score?.home_score ?? 0,
    awayScore: score?.away_score ?? 0,
  };
}

function parseMatchId(value: string) {
  const matchId = Number(value);
  return Number.isInteger(matchId) && matchId > 0 ? matchId : null;
}

export default async function AdminMatchScoringPage({
  params,
}: {
  params: { matchId: string };
}) {
  const matchId = parseMatchId(params.matchId);

  if (!matchId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: rawMatch, error: matchError } = await supabase
    .from("matches")
    .select(
      `
        id,
        match_number,
        status,
        home_team_id,
        away_team_id,
        is_bye,
        round:rounds(name),
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        match_scores(home_score, away_score)
      `
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !rawMatch || rawMatch.is_bye) {
    notFound();
  }

  const match = rawMatch as unknown as RawMatch;
  const teamIds = [match.home_team_id, match.away_team_id].filter(
    (id): id is number => typeof id === "number"
  );

  const [playersResult, statsResult] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from("players")
          .select("id,name,jersey_number,team_id")
          .in("team_id", teamIds)
          .order("team_id", { ascending: true })
          .order("jersey_number", { ascending: true, nullsFirst: false })
          .order("name", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("player_match_stats")
      .select("player_id,goals,saves")
      .eq("match_id", match.id),
  ]);

  if (playersResult.error) {
    throw new Error(playersResult.error.message);
  }

  if (statsResult.error) {
    throw new Error(statsResult.error.message);
  }

  const statsByPlayer = new Map<number, RawStat>(
    ((statsResult.data ?? []) as RawStat[]).map((stat) => [stat.player_id, stat])
  );

  const players: ScoringPlayer[] = ((playersResult.data ?? []) as RawPlayer[]).map(
    (player) => {
      const stat = statsByPlayer.get(player.id);
      return {
        id: player.id,
        name: player.name,
        jerseyNumber: player.jersey_number,
        teamId: player.team_id,
        goals: stat?.goals ?? 0,
        saves: stat?.saves ?? 0,
      };
    }
  );

  const initialMatch: ScoringMatch = {
    id: match.id,
    matchNumber: match.match_number,
    roundName: match.round?.name ?? "Unassigned",
    status: match.status,
    homeTeam: {
      id: match.home_team_id,
      name: match.home_team?.name ?? "TBD",
    },
    awayTeam: {
      id: match.away_team_id,
      name: match.away_team?.name ?? "TBD",
    },
    ...getScore(match.match_scores),
  };

  return <MatchScoringClient initialMatch={initialMatch} initialPlayers={players} />;
}
