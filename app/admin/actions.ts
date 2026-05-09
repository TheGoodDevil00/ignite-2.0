"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateFixturesFromRegisteredTeams } from "@/lib/fixtureGenerator";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/lib/supabase/types";

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@ignite.local";

type ActionResult = {
  ok: boolean;
  message: string;
};

type ResetTournamentDataPayload = {
  identifier: string;
  password: string;
  confirmation: string;
};

async function requireAdmin() {
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

  if (profileError || profile.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return { supabase, userId };
}

function getAdminEmail(identifier: string) {
  return identifier.trim().toLowerCase() === ADMIN_USERNAME
    ? ADMIN_EMAIL
    : identifier.trim();
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

export async function updateMatchDetails(
  matchId: number,
  values: {
    estimatedStart: string;
    venueDetail: string;
    status: MatchStatus;
  }
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const estimatedStart = values.estimatedStart
    ? new Date(values.estimatedStart).toISOString()
    : null;

  const { error } = await supabase
    .from("matches")
    .update({
      estimated_start: estimatedStart,
      venue_detail: values.venueDetail,
      status: values.status,
    })
    .eq("id", matchId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/fixtures");
  revalidatePath("/");
  return { ok: true, message: "Fixture saved." };
}

export async function saveMatchScore(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin();

  const { error: scoreError } = await supabase.from("match_scores").upsert(
    {
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      updated_by: userId,
    },
    { onConflict: "match_id" }
  );

  if (scoreError) {
    return { ok: false, message: scoreError.message };
  }

  const { error: matchError } = await supabase
    .from("matches")
    .update({ status: "completed" })
    .eq("id", matchId);

  if (matchError) {
    return { ok: false, message: matchError.message };
  }

  revalidatePath("/admin/scores");
  revalidatePath("/admin/fixtures");
  revalidatePath("/");
  return { ok: true, message: "Score saved and match completed." };
}

export async function upsertTeam(
  teamId: number | null,
  values: {
    name: string;
    group: string;
    contactDetail: string;
  }
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const payload = {
    name: values.name.trim(),
    group: values.group.trim() || null,
    contact_detail: values.contactDetail.trim(),
  };

  if (!payload.name) {
    return { ok: false, message: "Team name is required." };
  }

  if (!payload.contact_detail) {
    return { ok: false, message: "Contact detail is required." };
  }

  const query = teamId
    ? supabase.from("teams").update(payload).eq("id", teamId)
    : supabase.from("teams").insert(payload);

  const { error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/teams");
  revalidatePath("/");
  return { ok: true, message: teamId ? "Team updated." : "Team added." };
}

export async function deleteTeam(teamId: number): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/teams");
  revalidatePath("/");
  return { ok: true, message: "Team deleted." };
}

export async function upsertPlayer(
  playerId: number | null,
  teamId: number,
  values: {
    name: string;
    jerseyNumber: number;
  }
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const name = values.name.trim();
  const jerseyNumber = values.jerseyNumber;

  if (!name) {
    return { ok: false, message: "Player name is required." };
  }

  if (!Number.isInteger(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 999) {
    return { ok: false, message: "Jersey number must be between 0 and 999." };
  }

  let duplicateQuery = supabase
    .from("players")
    .select("id")
    .eq("team_id", teamId)
    .eq("jersey_number", jerseyNumber)
    .limit(1);

  if (playerId) {
    duplicateQuery = duplicateQuery.neq("id", playerId);
  }

  const { data: duplicates, error: duplicateError } = await duplicateQuery;

  if (duplicateError) {
    return { ok: false, message: duplicateError.message };
  }

  if ((duplicates ?? []).length > 0) {
    return { ok: false, message: "Jersey number is already used by this team." };
  }

  const payload = {
    name,
    jersey_number: jerseyNumber,
    team_id: teamId,
  };

  const query = playerId
    ? supabase.from("players").update(payload).eq("id", playerId).eq("team_id", teamId)
    : supabase.from("players").insert(payload);

  const { error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/teams");
  revalidatePath("/");
  return { ok: true, message: playerId ? "Player updated." : "Player added." };
}

export async function removePlayer(playerId: number): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/teams");
  revalidatePath("/");
  return { ok: true, message: "Player removed." };
}

export async function updateConfigValue(
  key: string,
  value: string
): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("site_config").upsert(
    {
      key,
      value,
      updated_by: userId,
    },
    { onConflict: "key" }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function resetTournamentData(
  values: ResetTournamentDataPayload
): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const identifier = values.identifier.trim();
  const password = values.password;
  const confirmation = values.confirmation.trim();

  if (!identifier || !password) {
    return { ok: false, message: "Admin username and password are required." };
  }

  if (confirmation !== "CLEAR") {
    return { ok: false, message: 'Type "CLEAR" to confirm.' };
  }

  const service = createServiceRoleClient();
  const { data: authData, error: authError } = await service.auth.signInWithPassword({
    email: getAdminEmail(identifier),
    password,
  });
  const authedUserId = authData.user?.id;

  if (authError || !authedUserId) {
    return { ok: false, message: "Admin credentials could not be verified." };
  }

  if (authedUserId !== userId) {
    return { ok: false, message: "Use the same admin account that is currently signed in." };
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", authedUserId)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, message: "This account is not an IGNITE admin." };
  }

  const deletes = [
    {
      table: "player_match_stats",
      optional: true,
      query: service.from("player_match_stats").delete().not("id", "is", null),
    },
    {
      table: "match_scores",
      optional: false,
      query: service.from("match_scores").delete().not("match_id", "is", null),
    },
    {
      table: "matches",
      optional: false,
      query: service.from("matches").delete().not("id", "is", null),
    },
    {
      table: "rounds",
      optional: false,
      query: service.from("rounds").delete().not("id", "is", null),
    },
    {
      table: "players",
      optional: false,
      query: service.from("players").delete().not("id", "is", null),
    },
    {
      table: "teams",
      optional: false,
      query: service.from("teams").delete().not("id", "is", null),
    },
  ];

  for (const item of deletes) {
    const { error } = await item.query;

    if (error) {
      if (item.optional && (error.message.includes("schema cache") || error.code === "42P01")) {
        continue;
      }

      return { ok: false, message: error.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin/scores");
  revalidatePath("/");

  return { ok: true, message: "Tournament teams, players, fixtures, and scores were cleared." };
}

export async function runFixtureGenerator(
  _previousState: ActionResult | null,
  _formData?: FormData
): Promise<ActionResult> {
  await requireAdmin();

  try {
    const result = await generateFixturesFromRegisteredTeams(createServiceRoleClient());

    revalidatePath("/admin/fixtures");
    revalidatePath("/admin/scores");
    revalidatePath("/");

    return {
      ok: true,
      message: [
        "Fixture generator completed.",
        `${result.teams} teams, ${result.rounds} rounds, ${result.matches} matches created.`,
        "",
        ...result.lines,
      ].join("\n"),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fixture generator failed.";
    return { ok: false, message };
  }
}
