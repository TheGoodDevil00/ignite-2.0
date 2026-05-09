"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, UserPlus } from "lucide-react";
import { addPlayer, removePlayer, upsertTeam } from "@/app/admin/actions";

export type TeamAdminRow = {
  id: number;
  name: string;
  group: string | null;
  players: Array<{
    id: number;
    name: string;
    jerseyNumber: number | null;
  }>;
};

export function TeamsAdminClient({ teams }: { teams: TeamAdminRow[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onAddTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await upsertTeam(null, {
        name: String(formData.get("name") ?? ""),
        group: String(formData.get("group") ?? ""),
      });
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function onUpdateTeam(event: FormEvent<HTMLFormElement>, teamId: number) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await upsertTeam(teamId, {
        name: String(formData.get("name") ?? ""),
        group: String(formData.get("group") ?? ""),
      });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  function onAddPlayer(event: FormEvent<HTMLFormElement>, teamId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawNumber = String(formData.get("jerseyNumber") ?? "");

    startTransition(async () => {
      const result = await addPlayer(teamId, {
        name: String(formData.get("name") ?? ""),
        jerseyNumber: rawNumber ? Number(rawNumber) : null,
      });
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function onRemovePlayer(playerId: number) {
    startTransition(async () => {
      const result = await removePlayer(playerId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 rounded-lg border border-subtle bg-card p-4 sm:grid-cols-[1fr_160px_auto]"
        onSubmit={onAddTeam}
      >
        <input className="form-input" name="name" placeholder="Team name" required />
        <input className="form-input" name="group" placeholder="Group" />
        <button
          className="inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          <Plus size={15} />
          Add Team
        </button>
      </form>

      {message ? <p className="text-sm font-semibold text-muted">{message}</p> : null}

      <div className="grid gap-4">
        {teams.map((team) => (
          <article className="rounded-lg border border-subtle bg-card p-4 shadow-glass" key={team.id}>
            <form
              className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"
              onSubmit={(event) => onUpdateTeam(event, team.id)}
            >
              <input className="form-input" name="name" defaultValue={team.name} required />
              <input className="form-input" name="group" defaultValue={team.group ?? ""} />
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-field px-4 py-2 text-xs font-bold uppercase text-muted transition hover:text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                <Save size={15} />
                Save Team
              </button>
            </form>

            <div className="mt-4 grid gap-2">
              {team.players.length === 0 ? (
                <p className="rounded border border-subtle bg-field px-3 py-2 text-sm text-muted">
                  No players added yet.
                </p>
              ) : (
                team.players.map((player) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded border border-subtle bg-field px-3 py-2"
                    key={player.id}
                  >
                    <span className="text-sm font-bold text-white">
                      {player.jerseyNumber !== null ? `#${player.jerseyNumber} ` : ""}
                      {player.name}
                    </span>
                    <button
                      type="button"
                      className="icon-button h-8 w-8"
                      disabled={isPending}
                      onClick={() => onRemovePlayer(player.id)}
                      aria-label={`Remove ${player.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px_auto]"
              onSubmit={(event) => onAddPlayer(event, team.id)}
            >
              <input className="form-input" name="name" placeholder="Player name" required />
              <input
                className="form-input"
                name="jerseyNumber"
                placeholder="Jersey"
                type="number"
                min={0}
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-field px-4 py-2 text-xs font-bold uppercase text-muted transition hover:text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                <UserPlus size={15} />
                Add Player
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
