import { createClient } from "@/lib/supabase/server";
import { TeamsAdminClient, type TeamAdminRow } from "./TeamsAdminClient";

export const dynamic = "force-dynamic";

type RawTeam = {
  id: number;
  name: string;
  group: string | null;
  players: Array<{
    id: number;
    name: string;
    jersey_number: number | null;
  }> | null;
};

export default async function AdminTeamsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id,name,group,players(id,name,jersey_number)")
    .order("name", { ascending: true });

  const teams: TeamAdminRow[] = ((data ?? []) as unknown as RawTeam[]).map((team) => ({
    id: team.id,
    name: team.name,
    group: team.group,
    players: (team.players ?? [])
      .map((player) => ({
        id: player.id,
        name: player.name,
        jerseyNumber: player.jersey_number,
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
