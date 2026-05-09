"use server";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/lib/supabase/types";

const execFileAsync = promisify(execFile);

type ActionResult = {
  ok: boolean;
  message: string;
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
  }
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const payload = {
    name: values.name.trim(),
    group: values.group.trim() || null,
  };

  if (!payload.name) {
    return { ok: false, message: "Team name is required." };
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

export async function addPlayer(
  teamId: number,
  values: {
    name: string;
    jerseyNumber: number | null;
  }
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const name = values.name.trim();

  if (!name) {
    return { ok: false, message: "Player name is required." };
  }

  const { error } = await supabase.from("players").insert({
    name,
    jersey_number: values.jerseyNumber,
    team_id: teamId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/teams");
  return { ok: true, message: "Player added." };
}

export async function removePlayer(playerId: number): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/teams");
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

export async function runFixtureGenerator(
  _previousState: ActionResult | null,
  _formData?: FormData
): Promise<ActionResult> {
  await requireAdmin();

  try {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const { stdout, stderr } = await execFileAsync(
      command,
      ["tsx", "scripts/generateFixtures.ts"],
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024,
      }
    );

    revalidatePath("/admin/fixtures");
    revalidatePath("/admin/scores");
    revalidatePath("/");

    return {
      ok: true,
      message: stdout || stderr || "Fixture generator completed.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fixture generator failed.";
    return { ok: false, message };
  }
}
