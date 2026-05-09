import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "@/lib/supabase/types";

type Format = "round-robin";

type Config = {
  groupCount: number;
  teamsPerGroup: number;
  format: Format;
  matchDurationMinutes: number;
  startDate: string;
  dailyMatchLimit: number;
  venue: string;
  seed: string;
};

type TeamSlot = {
  name: string;
  group: string;
};

type GeneratedMatch = {
  homeTeamName: string;
  awayTeamName: string | null;
  byeTeamName: string | null;
  group: string;
  isBye: boolean;
  matchNumber: number;
  estimatedStart: string;
  venue: string;
};

const projectDir = process.cwd();
loadEnvConfig(projectDir);

function parseArgs(): Partial<Config> {
  return process.argv.slice(2).reduce<Partial<Config>>((acc, arg) => {
    const [rawKey, ...valueParts] = arg.replace(/^--/, "").split("=");
    const value = valueParts.join("=");

    if (!rawKey || !value) return acc;

    if (
      rawKey === "groupCount" ||
      rawKey === "teamsPerGroup" ||
      rawKey === "matchDurationMinutes" ||
      rawKey === "dailyMatchLimit"
    ) {
      acc[rawKey] = Number(value);
    } else if (rawKey === "format") {
      acc.format = value as Format;
    } else if (rawKey === "startDate" || rawKey === "venue" || rawKey === "seed") {
      acc[rawKey] = value;
    }

    return acc;
  }, {});
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: string) {
  const random = seededRandom(seed);
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function groupLabel(index: number) {
  return `Group ${String.fromCharCode(65 + index)}`;
}

function distributeTeams(teamNames: string[], config: Config): TeamSlot[] {
  const shuffled = shuffle(teamNames, config.seed);

  return shuffled.map((name, index) => ({
    name,
    group: groupLabel(index % config.groupCount),
  }));
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function nextKickoff(startDate: Date, index: number, config: Config) {
  const dayOffset = Math.floor(index / config.dailyMatchLimit);
  const slotOffset = index % config.dailyMatchLimit;
  return addMinutes(
    addMinutes(startDate, dayOffset * 24 * 60),
    slotOffset * config.matchDurationMinutes
  );
}

function generateRoundRobin(groups: Map<string, TeamSlot[]>, config: Config) {
  const startDate = new Date(config.startDate);
  const matches: GeneratedMatch[] = [];
  let matchNumber = 1;

  for (const [group, teams] of Array.from(groups.entries())) {
    const slots: Array<TeamSlot | null> =
      teams.length % 2 === 0 ? [...teams] : [...teams, null];
    const roundCount = slots.length - 1;

    for (let round = 0; round < roundCount; round += 1) {
      for (let pairIndex = 0; pairIndex < slots.length / 2; pairIndex += 1) {
        const home = slots[pairIndex];
        const away = slots[slots.length - 1 - pairIndex];
        const kickoff = nextKickoff(startDate, matches.length, config);
        const activeTeam = home ?? away;

        if (!activeTeam) continue;

        matches.push({
          homeTeamName: home?.name ?? activeTeam.name,
          awayTeamName: away?.name ?? null,
          byeTeamName: home && away ? null : activeTeam.name,
          group,
          isBye: !home || !away,
          matchNumber,
          estimatedStart: kickoff.toISOString(),
          venue: config.venue,
        });
        matchNumber += 1;
      }

      const [fixed, ...rotating] = slots;
      rotating.unshift(rotating.pop() ?? null);
      slots.splice(0, slots.length, fixed, ...rotating);
    }
  }

  return matches;
}

async function readTeams() {
  const teamsPath = path.join(projectDir, "scripts", "teams.json");
  const raw = await readFile(teamsPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    parsed.some((team) => typeof team !== "string" || !team.trim())
  ) {
    throw new Error("scripts/teams.json must be a non-empty array of team names.");
  }

  return parsed.map((team) => team.trim());
}

function createConfig(teamCount: number): Config {
  const args = parseArgs();
  const teamsPerGroup = args.teamsPerGroup ?? 3;

  return {
    groupCount: args.groupCount ?? Math.ceil(teamCount / teamsPerGroup),
    teamsPerGroup,
    format: args.format ?? "round-robin",
    matchDurationMinutes: args.matchDurationMinutes ?? 20,
    startDate: args.startDate ?? "2026-05-25T17:00:00+05:30",
    dailyMatchLimit: args.dailyMatchLimit ?? 8,
    venue: args.venue ?? "Turf Dehu Road",
    seed: args.seed ?? "ignite-2.0",
  };
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const teamNames = await readTeams();
  const config = createConfig(teamNames.length);

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("your_")) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  }

  if (config.format !== "round-robin") {
    throw new Error('Only format="round-robin" is supported in Phase 3.');
  }

  if (config.groupCount < 1 || config.teamsPerGroup < 1) {
    throw new Error("groupCount and teamsPerGroup must be positive numbers.");
  }

  if (Number.isNaN(Date.parse(config.startDate))) {
    throw new Error("startDate must be a valid ISO date string.");
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const distributedTeams = distributeTeams(teamNames, config);
  const groups = distributedTeams.reduce((map, team) => {
    const existing = map.get(team.group) ?? [];
    existing.push(team);
    map.set(team.group, existing);
    return map;
  }, new Map<string, TeamSlot[]>());
  const generatedMatches = generateRoundRobin(groups, config);

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .upsert(
      distributedTeams.map((team) => ({
        name: team.name,
        group: team.group,
      })),
      { onConflict: "name" }
    )
    .select("id,name");

  if (teamError) throw teamError;

  const teamIdByName = new Map(teamRows?.map((team) => [team.name, team.id]));

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .upsert({ name: "Group Stage", round_number: 1 }, { onConflict: "round_number" })
    .select("id")
    .single();

  if (roundError) throw roundError;

  const matchRows = generatedMatches.map((match) => {
    const homeTeamId = teamIdByName.get(match.homeTeamName);
    const awayTeamId = match.awayTeamName ? teamIdByName.get(match.awayTeamName) : null;
    const byeTeamId = match.byeTeamName ? teamIdByName.get(match.byeTeamName) : null;

    if (!homeTeamId || (!match.isBye && !awayTeamId) || (match.isBye && !byeTeamId)) {
      throw new Error(`Could not resolve team IDs for match ${match.matchNumber}.`);
    }

    return {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      round_id: round.id,
      status: "scheduled" as const,
      estimated_start: match.estimatedStart,
      venue_detail: match.venue,
      is_bye: match.isBye,
      bye_team_id: byeTeamId,
      match_number: match.matchNumber,
    };
  });

  const { data: insertedMatches, error: matchError } = await supabase
    .from("matches")
    .upsert(matchRows, { onConflict: "match_number" })
    .select("id,match_number");

  if (matchError) throw matchError;

  const scoreRows =
    insertedMatches?.map((match) => ({
      match_id: match.id,
      home_score: 0,
      away_score: 0,
    })) ?? [];

  if (scoreRows.length > 0) {
    const { error: scoreError } = await supabase
      .from("match_scores")
      .upsert(scoreRows, { onConflict: "match_id" });

    if (scoreError) throw scoreError;
  }

  console.log("Fixture generation complete.");
  console.table({
    teams: distributedTeams.length,
    groups: groups.size,
    matches: matchRows.length,
    byes: matchRows.filter((match) => match.is_bye).length,
    firstKickoff: matchRows[0]?.estimated_start ?? "n/a",
    venue: config.venue,
    seed: config.seed,
  });

  console.table(
    generatedMatches.map((match) => ({
      match: match.matchNumber,
      group: match.group,
      home: match.homeTeamName,
      away: match.awayTeamName ?? "BYE",
      kickoff: match.estimatedStart,
      bye: match.isBye,
    }))
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
