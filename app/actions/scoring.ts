"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { advanceWinner } from "@/lib/bracket";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type StatName = "goals" | "saves";

export type ScoringActionResult = {
  ok: boolean;
  message: string;
};

export type UpdatePlayerStatResult = ScoringActionResult & {
  playerId?: number;
  goals?: number;
  saves?: number;
  goalsTotal?: number;
  savesTotal?: number;
  homeScore?: number;
  awayScore?: number;
};

type StatDeltaPayload = {
  matchId: number;
  playerId: number;
  stat: StatName;
  delta: number;
};

async function requireScorekeeperProfile() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (error || !userId) {
    redirect("/admin/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !["admin", "scorer"].includes(profile?.role ?? "")) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return { supabase, userId, role: profile.role };
}

async function canScoreMatch(matchId: number, userId: string, role: string) {
  if (role === "admin") return true;

  const service = createServiceRoleClient();
  const { data, error } = await service
    .from("matches")
    .select("scorer_id")
    .eq("id", matchId)
    .single();

  if (error) return false;
  return !data.scorer_id || data.scorer_id === userId;
}

function parsePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return value;
}

function isStatName(value: string): value is StatName {
  return value === "goals" || value === "saves";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function revalidateScoreViews(matchId: number) {
  revalidatePath(`/admin/scores/${matchId}`);
  revalidatePath("/admin/scores");
  revalidatePath("/admin/fixtures");
  revalidatePath("/");
}

export async function updatePlayerMatchStat(
  payload: StatDeltaPayload
): Promise<UpdatePlayerStatResult> {
  let matchId: number;
  let playerId: number;

  try {
    matchId = parsePositiveInteger(payload.matchId, "matchId");
    playerId = parsePositiveInteger(payload.playerId, "playerId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid stat update.",
    };
  }

  if (!isStatName(payload.stat)) {
    return { ok: false, message: "Invalid stat type." };
  }

  if (!Number.isInteger(payload.delta) || payload.delta === 0) {
    return { ok: false, message: "Stat delta must be a non-zero integer." };
  }

  const { userId, role } = await requireScorekeeperProfile();

  if (!(await canScoreMatch(matchId, userId, role))) {
    return { ok: false, message: "This scorer is not assigned to this match." };
  }

  const service = createServiceRoleClient();
  const { data, error } = await service.rpc("apply_player_match_stat_delta", {
    p_match_id: matchId,
    p_player_id: playerId,
    p_stat: payload.stat,
    p_delta: payload.delta,
    p_updated_by: userId,
  });

  if (error) {
    if (
      error.message.includes("apply_player_match_stat_delta") ||
      error.message.includes("schema cache")
    ) {
      return {
        ok: false,
        message:
          "Live scoring database function is missing. Run the latest Supabase scoring migration, then try again.",
      };
    }

    return { ok: false, message: error.message };
  }

  revalidateScoreViews(matchId);

  if (!isRecord(data)) {
    return { ok: true, message: "Stat updated." };
  }

  return {
    ok: true,
    message: "Stat updated.",
    playerId: readNumber(data.player_id),
    goals: readNumber(data.goals),
    saves: readNumber(data.saves),
    goalsTotal: readNumber(data.goals_total),
    savesTotal: readNumber(data.saves_total),
    homeScore: readNumber(data.home_score),
    awayScore: readNumber(data.away_score),
  };
}

export async function markMatchLive(matchIdValue: number): Promise<ScoringActionResult> {
  let matchId: number;

  try {
    matchId = parsePositiveInteger(matchIdValue, "matchId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid match.",
    };
  }

  const { supabase } = await requireScorekeeperProfile();
  const { data, error } = await supabase
    .from("matches")
    .update({ status: "live" })
    .eq("id", matchId)
    .eq("status", "scheduled")
    .select("id,status")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    const { data: current } = await supabase
      .from("matches")
      .select("status")
      .eq("id", matchId)
      .maybeSingle();

    if (current?.status === "live") {
      return { ok: true, message: "Match is already live." };
    }

    return { ok: false, message: "Only scheduled matches can be marked live." };
  }

  revalidateScoreViews(matchId);
  return { ok: true, message: "Match marked live." };
}

export async function completeMatch(
  matchIdValue: number,
  winnerIdValue: number
): Promise<ScoringActionResult> {
  let matchId: number;
  let winnerId: number;

  try {
    matchId = parsePositiveInteger(matchIdValue, "matchId");
    winnerId = parsePositiveInteger(winnerIdValue, "winnerId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid match result.",
    };
  }

  const { supabase, userId, role } = await requireScorekeeperProfile();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return { ok: false, message: "Match was not found." };
  }

  if (match.status !== "live") {
    return { ok: false, message: "Only live matches can be completed." };
  }

  if (winnerId !== match.home_team_id && winnerId !== match.away_team_id) {
    return { ok: false, message: "Winner must be one of the match teams." };
  }

  if (!(await canScoreMatch(matchId, userId, role))) {
    return { ok: false, message: "This scorer is not assigned to this match." };
  }

  try {
    await advanceWinner(String(matchId), String(winnerId));
  } catch (error) {
    console.error("Failed to complete match:", error);
    return {
      ok: false,
      message: "Failed to complete match — bracket not updated. Try again.",
    };
  }

  revalidateScoreViews(matchId);
  return { ok: true, message: "Match completed." };
}
