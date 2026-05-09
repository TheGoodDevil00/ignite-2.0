import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { generateFixturesFromRegisteredTeams } from "@/lib/fixtureGenerator";
import type { Database } from "@/lib/supabase/types";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("your_")) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (isDryRun) {
    const { data: teams, error } = await supabase
      .from("teams")
      .select("id,name")
      .order("name", { ascending: true });

    if (error) throw error;

    console.log("Dry run - no data written.");
    console.table({
      teams: teams?.length ?? 0,
      source: "registered teams table",
    });
    return;
  }

  const result = await generateFixturesFromRegisteredTeams(supabase);

  console.log("Single-elimination bracket generated.");
  console.table({
    teams: result.teams,
    rounds: result.rounds,
    matches: result.matches,
    venue: result.venue,
    seed: result.seed,
  });
  console.log(result.lines.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
