import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const MATCH_DURATION_MINUTES = 20;
const BREAK_BETWEEN_MATCHES_MINUTES = 10;
const ADVANCEMENT_INTERVAL_MINUTES =
  MATCH_DURATION_MINUTES + BREAK_BETWEEN_MATCHES_MINUTES;

type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

function parseDatabaseId(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive numeric database ID.`);
  }

  return parsed;
}

function addMinutesToIso(value: string | null, minutes: number) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

export async function advanceWinner(
  matchId: string,
  winnerId: string
): Promise<void> {
  const parsedMatchId = parseDatabaseId(matchId, "matchId");
  const parsedWinnerId = parseDatabaseId(winnerId, "winnerId");
  const supabase = createServiceRoleClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id,home_team_id,away_team_id,next_match_id,next_match_slot,estimated_start"
    )
    .eq("id", parsedMatchId)
    .single();

  if (matchError || !match) {
    throw new Error(matchError?.message ?? "Match was not found.");
  }

  if (
    parsedWinnerId !== match.home_team_id &&
    parsedWinnerId !== match.away_team_id
  ) {
    throw new Error(`Winner ${parsedWinnerId} is not assigned to match ${parsedMatchId}.`);
  }

  if (
    match.next_match_id &&
    match.next_match_slot !== "home" &&
    match.next_match_slot !== "away"
  ) {
    throw new Error(
      `Match ${parsedMatchId} has invalid next slot ${match.next_match_slot}.`
    );
  }

  const { data: existingNextMatch, error: existingNextMatchError } =
    match.next_match_id
      ? await supabase
          .from("matches")
          .select("id")
          .eq("id", match.next_match_id)
          .single()
      : { data: null, error: null };

  if (existingNextMatchError || (match.next_match_id && !existingNextMatch)) {
    throw new Error(existingNextMatchError?.message ?? "Next match was not found.");
  }

  const { error: completeError } = await supabase
    .from("matches")
    .update({
      winner_id: parsedWinnerId,
      status: "completed",
    })
    .eq("id", parsedMatchId);

  if (completeError) {
    throw new Error(completeError.message);
  }

  if (!match.next_match_id) {
    return;
  }

  const nextSlotUpdate: MatchUpdate =
    match.next_match_slot === "home"
      ? { home_team_id: parsedWinnerId }
      : { away_team_id: parsedWinnerId };

  const { error: nextSlotError } = await supabase
    .from("matches")
    .update(nextSlotUpdate)
    .eq("id", match.next_match_id);

  if (nextSlotError) {
    throw new Error(nextSlotError.message);
  }

  const { data: nextMatch, error: nextMatchError } = await supabase
    .from("matches")
    .select("home_team_id,away_team_id")
    .eq("id", match.next_match_id)
    .single();

  if (nextMatchError || !nextMatch) {
    throw new Error(nextMatchError?.message ?? "Next match was not found.");
  }

  if (nextMatch.home_team_id && nextMatch.away_team_id) {
    const startTime = addMinutesToIso(
      match.estimated_start,
      ADVANCEMENT_INTERVAL_MINUTES
    );
    const nextMatchUpdate: MatchUpdate = {
      status: "scheduled",
    };

    if (startTime) {
      nextMatchUpdate.estimated_start = startTime;
    }

    const { error: readyError } = await supabase
      .from("matches")
      .update(nextMatchUpdate)
      .eq("id", match.next_match_id);

    if (readyError) {
      throw new Error(readyError.message);
    }
  }
}
