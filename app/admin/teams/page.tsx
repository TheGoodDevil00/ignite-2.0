import { createClient } from "@/lib/supabase/server";
import { TeamsAdminClient, type TeamAdminRow } from "./TeamsAdminClient";

export const dynamic = "force-dynamic";

type RawTeam = {
  id: number;
  name: string;
  group: string | null;
  contact_detail: string | null;
};

type RawPlayer = {
  id: number;
  name: string;
  jersey_number: number | null;
  team_id: number;
};

export default async function AdminTeamsPage() {
  const supabase = await createClient();
  const [teamsResult, playersResult] = await Promise.all([
    supabase
    .from("teams")
      .select("id,name,group,contact_detail")
      .order("name", { ascending: true }),
    supabase
      .from("players")
      .select("id,name,jersey_number,team_id")
      .order("jersey_number", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
  ]);

  if (teamsResult.error) {
    throw new Error(teamsResult.error.message);
  }

  if (playersResult.error) {
    throw new Error(playersResult.error.message);
  }

  const playersByTeam = new Map<number, RawPlayer[]>();

  for (const player of (playersResult.data ?? []) as RawPlayer[]) {
    const current = playersByTeam.get(player.team_id) ?? [];
    current.push(player);
    playersByTeam.set(player.team_id, current);
  }

  const teams: TeamAdminRow[] = ((teamsResult.data ?? []) as unknown as RawTeam[]).map((team) => ({
    id: team.id,
    name: team.name,
    group: team.group,
    contactDetail: team.contact_detail,
    players: (playersByTeam.get(team.id) ?? [])
      .map((player) => ({
        id: player.id,
        name: player.name,
        jerseyNumber: player.jersey_number,
        goalsTotal: 0,
        savesTotal: 0,
      }))
      .sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase text-muted">Roster management</p>
        <h1 className="mt-2 text-3xl font-black uppercase text-white">Teams & Players</h1>
      </div>

      <TeamsAdminClient teams={teams} />
    </div>
  );
}
