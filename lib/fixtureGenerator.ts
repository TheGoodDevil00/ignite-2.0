import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const CONFIG = {
  startDate: "2026-07-26T08:00:00+05:30",
  bracketSeed: "nawu-2026",
  matchDurationMinutes: 20,
  breakBetweenMatchesMinutes: 10,
  venue: "Nawu Sports Club, Mamurdi",
};

type TeamSeed = {
  id: number;
  name: string;
};

type RoundPayload = {
  localKey: string;
  name: string;
  roundNumber: number;
};

type MatchPayload = {
  localKey: string;
  roundKey: string;
  roundIndex: number;
  roundMatchIndex: number;
  matchNumber: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  status: "scheduled";
  estimatedStart: string | null;
  venueDetail: string;
  nextLocalKey: string | null;
  nextMatchSlot: "home" | "away" | null;
};

type InsertedMatch = {
  id: number;
  match_number: number;
};

export type FixtureGeneratorResult = {
  teams: number;
  rounds: number;
  matches: number;
  venue: string;
  seed: string;
  lines: string[];
};

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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

function roundName(roundIndex: number, roundCount: number) {
  const roundsRemaining = roundCount - roundIndex;
  const teamsRemaining = 2 ** (roundsRemaining + 1);

  if (teamsRemaining === 2) return "Final";
  if (teamsRemaining === 4) return "Semifinals";
  if (teamsRemaining === 8) return "Quarterfinals";
  return `Round of ${teamsRemaining}`;
}

function localRoundKey(roundIndex: number) {
  return `R${roundIndex}`;
}

function localMatchKey(roundIndex: number, roundMatchIndex: number) {
  return `R${roundIndex}M${roundMatchIndex}`;
}

function buildBracket(teams: TeamSeed[]) {
  const roundCount = Math.log2(teams.length);
  const shuffledTeams = shuffle(teams, CONFIG.bracketSeed);
  const rounds: RoundPayload[] = Array.from({ length: roundCount }, (_, index) => ({
    localKey: localRoundKey(index + 1),
    name: roundName(index + 1, roundCount),
    roundNumber: index + 1,
  }));
  const matches: MatchPayload[] = [];
  const intervalMinutes =
    CONFIG.matchDurationMinutes + CONFIG.breakBetweenMatchesMinutes;
  const startDate = new Date(CONFIG.startDate);
  let matchNumber = 1;

  for (let roundIndex = 1; roundIndex <= roundCount; roundIndex += 1) {
    const matchesInRound = teams.length / 2 ** roundIndex;

    for (let roundMatchIndex = 1; roundMatchIndex <= matchesInRound; roundMatchIndex += 1) {
      const isFirstRound = roundIndex === 1;
      const teamOffset = (roundMatchIndex - 1) * 2;
      const nextRoundIndex = roundIndex + 1;
      const nextRoundMatchIndex = Math.ceil(roundMatchIndex / 2);
      const hasNextMatch = roundIndex < roundCount;

      matches.push({
        localKey: localMatchKey(roundIndex, roundMatchIndex),
        roundKey: localRoundKey(roundIndex),
        roundIndex,
        roundMatchIndex,
        matchNumber,
        homeTeamId: isFirstRound ? shuffledTeams[teamOffset].id : null,
        awayTeamId: isFirstRound ? shuffledTeams[teamOffset + 1].id : null,
        status: "scheduled",
        estimatedStart: isFirstRound
          ? addMinutes(startDate, (roundMatchIndex - 1) * intervalMinutes).toISOString()
          : null,
        venueDetail: CONFIG.venue,
        nextLocalKey: hasNextMatch
          ? localMatchKey(nextRoundIndex, nextRoundMatchIndex)
          : null,
        nextMatchSlot: hasNextMatch
          ? roundMatchIndex % 2 === 1
            ? "home"
            : "away"
          : null,
      });

      matchNumber += 1;
    }
  }

  return { rounds, matches, shuffledTeams };
}

function matchLabel(match: MatchPayload) {
  return `R${match.roundIndex} M${match.roundMatchIndex}`;
}

function describeBracket(matches: MatchPayload[], teamsById: Map<number, string>) {
  return matches.map((match) => {
    const home = match.homeTeamId ? teamsById.get(match.homeTeamId) ?? "TBD" : "TBD";
    const away = match.awayTeamId ? teamsById.get(match.awayTeamId) ?? "TBD" : "TBD";
    const next = match.nextLocalKey
      ? `${match.nextLocalKey} [${match.nextMatchSlot}]`
      : "Champion";

    return `${matchLabel(match).padEnd(6)} ${`${home} vs ${away}`.padEnd(34)} -> ${next}`;
  });
}

async function assertRuntimeSchema(supabase: SupabaseClient<Database>) {
  const [matchesResult, playersResult, statsResult] = await Promise.all([
    supabase.from("matches").select("id,winner_id,next_match_id,next_match_slot").limit(1),
    supabase.from("players").select("id,goals_total,saves_total").limit(1),
    supabase.from("player_match_stats").select("id").limit(1),
  ]);
  const missing = [
    matchesResult.error ? "match bracket columns" : null,
    playersResult.error ? "player stat total columns" : null,
    statsResult.error ? "player match stats table" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Database schema is missing ${missing.join(", ")}. Run the latest Supabase migrations before generating fixtures.`
    );
  }
}

export async function generateFixturesFromRegisteredTeams(
  supabase: SupabaseClient<Database>
): Promise<FixtureGeneratorResult> {
  if (Number.isNaN(Date.parse(CONFIG.startDate))) {
    throw new Error("Fixture start date must be a valid ISO date string.");
  }

  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id,name")
    .order("name", { ascending: true });

  if (teamsError) throw new Error(teamsError.message);

  const teams = (teamsData ?? [])
    .map((team) => ({ id: team.id, name: team.name.trim() }))
    .filter((team) => team.name);

  await assertRuntimeSchema(supabase);

  if (teams.length < 2) {
    throw new Error("Add at least 2 teams before generating fixtures.");
  }

  if (!isPowerOfTwo(teams.length)) {
    throw new Error(
      `Team count must be a power of 2. Got ${teams.length}. Add or remove teams.`
    );
  }

  const { count: matchCount, error: matchCountError } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true });

  if (matchCountError) throw new Error(matchCountError.message);

  if ((matchCount ?? 0) > 0) {
    throw new Error("Fixtures already exist. Delete existing matches before regenerating.");
  }

  const bracket = buildBracket(teams);
  const { data: roundRows, error: roundError } = await supabase
    .from("rounds")
    .upsert(
      bracket.rounds.map((round) => ({
        name: round.name,
        round_number: round.roundNumber,
      })),
      { onConflict: "round_number" }
    )
    .select("id,round_number");

  if (roundError) throw new Error(roundError.message);

  const roundIdsByNumber = new Map(
    (roundRows ?? []).map((round) => [round.round_number, round.id])
  );
  const roundIdsByKey = new Map<string, number>();

  for (const round of bracket.rounds) {
    const roundId = roundIdsByNumber.get(round.roundNumber);

    if (!roundId) {
      throw new Error(`Round ${round.roundNumber} was not created.`);
    }

    roundIdsByKey.set(round.localKey, roundId);
  }

  const matchRows = bracket.matches.map((match) => {
    const roundId = roundIdsByKey.get(match.roundKey);

    if (!roundId) {
      throw new Error(`Round ${match.roundKey} is missing.`);
    }

    return {
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      round_id: roundId,
      status: match.status,
      estimated_start: match.estimatedStart,
      venue_detail: match.venueDetail,
      is_bye: false,
      bye_team_id: null,
      match_number: match.matchNumber,
    };
  });

  const { data: insertedMatches, error: insertError } = await supabase
    .from("matches")
    .insert(matchRows)
    .select("id,match_number");

  if (insertError) {
    if (insertError.message.includes("matches_bye_shape")) {
      throw new Error(
        "Database constraint matches_bye_shape is outdated. Run the latest Supabase migration, then try again."
      );
    }

    throw new Error(insertError.message);
  }

  const insertedByMatchNumber = new Map<number, InsertedMatch>(
    ((insertedMatches ?? []) as InsertedMatch[]).map((match) => [
      match.match_number,
      match,
    ])
  );
  const insertedByLocalKey = new Map<string, InsertedMatch>();

  for (const match of bracket.matches) {
    const inserted = insertedByMatchNumber.get(match.matchNumber);

    if (!inserted) {
      throw new Error(`Match #${match.matchNumber} was not created.`);
    }

    insertedByLocalKey.set(match.localKey, inserted);
  }

  for (const match of bracket.matches) {
    if (!match.nextLocalKey) continue;

    const current = insertedByLocalKey.get(match.localKey);
    const next = insertedByLocalKey.get(match.nextLocalKey);

    if (!current || !next) {
      throw new Error(`Next-match link for ${match.localKey} could not be created.`);
    }

    const { error: linkError } = await supabase
      .from("matches")
      .update({
        next_match_id: next.id,
        next_match_slot: match.nextMatchSlot,
      })
      .eq("id", current.id);

    if (linkError) throw new Error(linkError.message);
  }

  const { error: scoresError } = await supabase.from("match_scores").upsert(
    Array.from(insertedByLocalKey.values()).map((match) => ({
      match_id: match.id,
      home_score: 0,
      away_score: 0,
    })),
    { onConflict: "match_id" }
  );

  if (scoresError) throw new Error(scoresError.message);

  const teamsById = new Map(teams.map((team) => [team.id, team.name]));

  return {
    teams: teams.length,
    rounds: bracket.rounds.length,
    matches: bracket.matches.length,
    venue: CONFIG.venue,
    seed: CONFIG.bracketSeed,
    lines: describeBracket(bracket.matches, teamsById),
  };
}
