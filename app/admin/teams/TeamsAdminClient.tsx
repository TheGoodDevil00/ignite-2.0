"use client";

import { Fragment, FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  deleteTeam,
  removePlayer,
  upsertPlayer,
  upsertTeam,
} from "@/app/admin/actions";

export type TeamAdminRow = {
  id: number;
  name: string;
  group: string | null;
  contactDetail: string | null;
  players: Array<{
    id: number;
    name: string;
    jerseyNumber: number | null;
    goalsTotal: number;
    savesTotal: number;
  }>;
};

type TeamFormState = {
  id: number | null;
  name: string;
  group: string;
  contactDetail: string;
};

type PlayerFormState = {
  id: number | null;
  teamId: number;
  name: string;
  jerseyNumber: string;
};

type ConfirmState =
  | {
      type: "team";
      id: number;
      name: string;
    }
  | {
      type: "player";
      id: number;
      name: string;
    };

const emptyTeamForm: TeamFormState = {
  id: null,
  name: "",
  group: "",
  contactDetail: "",
};

function actionButtonClass(tone: "primary" | "quiet" | "danger" = "quiet") {
  if (tone === "primary") {
    return "inline-flex h-9 items-center justify-center gap-2 rounded bg-accent px-3 text-xs font-bold uppercase text-white transition disabled:opacity-60";
  }

  if (tone === "danger") {
    return "inline-flex h-9 items-center justify-center gap-2 rounded border border-red-500/40 bg-red-500/10 px-3 text-xs font-bold uppercase text-red-100 transition hover:border-red-400 disabled:opacity-60";
  }

  return "inline-flex h-9 items-center justify-center gap-2 rounded border border-subtle bg-field px-3 text-xs font-bold uppercase text-muted transition hover:text-white disabled:opacity-60";
}

export function TeamsAdminClient({ teams }: { teams: TeamAdminRow[] }) {
  const router = useRouter();
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(teams[0]?.id ?? null);
  const [teamForm, setTeamForm] = useState<TeamFormState | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState<PlayerFormState | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAddTeam() {
    setTeamError(null);
    setTeamForm(emptyTeamForm);
  }

  function openEditTeam(team: TeamAdminRow) {
    setTeamError(null);
    setTeamForm({
      id: team.id,
      name: team.name,
      group: team.group ?? "",
      contactDetail: team.contactDetail ?? "",
    });
  }

  function openAddPlayer(teamId: number) {
    setPlayerError(null);
    setPlayerForm({
      id: null,
      teamId,
      name: "",
      jerseyNumber: "",
    });
  }

  function openEditPlayer(teamId: number, player: TeamAdminRow["players"][number]) {
    setPlayerError(null);
    setPlayerForm({
      id: player.id,
      teamId,
      name: player.name,
      jerseyNumber: player.jerseyNumber === null ? "" : String(player.jerseyNumber),
    });
  }

  function onSaveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!teamForm) return;

    const name = teamForm.name.trim();
    const contactDetail = teamForm.contactDetail.trim();

    if (!name) {
      setTeamError("Team name is required.");
      return;
    }

    if (!contactDetail) {
      setTeamError("Contact detail is required.");
      return;
    }

    startTransition(async () => {
      const result = await upsertTeam(teamForm.id, {
        name,
        group: teamForm.group,
        contactDetail,
      });
      setMessage(result.message);
      setTeamError(result.ok ? null : result.message);
      if (result.ok) {
        setTeamForm(null);
        router.refresh();
      }
    });
  }

  function onSavePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!playerForm) return;

    const team = teams.find((item) => item.id === playerForm.teamId);
    const name = playerForm.name.trim();
    const jerseyNumber = Number(playerForm.jerseyNumber);

    if (!name) {
      setPlayerError("Player name is required.");
      return;
    }

    if (
      !playerForm.jerseyNumber.trim() ||
      !Number.isInteger(jerseyNumber) ||
      jerseyNumber < 0 ||
      jerseyNumber > 999
    ) {
      setPlayerError("Jersey number is required and must be between 0 and 999.");
      return;
    }

    const jerseyTaken = team?.players.some(
      (player) => player.id !== playerForm.id && player.jerseyNumber === jerseyNumber
    );

    if (jerseyTaken) {
      setPlayerError("Jersey number is already used by this team.");
      return;
    }

    startTransition(async () => {
      const result = await upsertPlayer(playerForm.id, playerForm.teamId, {
        name,
        jerseyNumber,
      });
      setMessage(result.message);
      setPlayerError(result.ok ? null : result.message);
      if (result.ok) {
        setPlayerForm(null);
        router.refresh();
      }
    });
  }

  function onConfirmDelete() {
    if (!confirm) return;

    startTransition(async () => {
      const result =
        confirm.type === "team"
          ? await deleteTeam(confirm.id)
          : await removePlayer(confirm.id);
      setMessage(result.message);
      if (result.ok) {
        setConfirm(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">Registered Teams</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {teams.length} {teams.length === 1 ? "team" : "teams"} in the database
          </p>
        </div>
        <button
          className={actionButtonClass("primary")}
          disabled={isPending}
          type="button"
          onClick={openAddTeam}
        >
          <Plus size={15} />
          Add Team
        </button>
      </div>

      {message ? <p className="text-sm font-semibold text-muted">{message}</p> : null}

      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-subtle bg-card p-8 text-center shadow-glass">
          <Users className="mx-auto text-muted" size={34} />
          <p className="mt-4 text-base font-black text-white">No teams registered yet.</p>
          <button
            className={`mx-auto mt-5 ${actionButtonClass("primary")}`}
            disabled={isPending}
            type="button"
            onClick={openAddTeam}
          >
            <Plus size={15} />
            Add First Team
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-subtle bg-card shadow-glass">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left">
              <thead className="bg-field text-xs uppercase text-muted">
                <tr>
                  <th className="w-12 px-4 py-3">Players</th>
                  <th className="px-4 py-3">Team Name</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Contact Detail</th>
                  <th className="px-4 py-3 text-center">Player Count</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const isExpanded = expandedTeamId === team.id;
                  return (
                    <Fragment key={team.id}>
                      <tr className="border-t border-subtle">
                        <td className="px-4 py-4 align-middle">
                          <button
                            className="icon-button h-8 w-8"
                            type="button"
                            onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${team.name}`}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <p className="font-black text-white">{team.name}</p>
                        </td>
                        <td className="px-4 py-4 align-middle text-sm font-semibold text-muted">
                          {team.group || "Unassigned"}
                        </td>
                        <td className="px-4 py-4 align-middle text-sm font-semibold text-muted">
                          {team.contactDetail || "Missing"}
                        </td>
                        <td className="px-4 py-4 text-center align-middle text-sm font-black text-white">
                          {team.players.length}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex justify-end gap-2">
                            <button
                              className={actionButtonClass()}
                              disabled={isPending}
                              type="button"
                              onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                            >
                              <Users size={14} />
                              Players
                            </button>
                            <button
                              className={actionButtonClass()}
                              disabled={isPending}
                              type="button"
                              onClick={() => openEditTeam(team)}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              className={actionButtonClass("danger")}
                              disabled={isPending}
                              type="button"
                              onClick={() =>
                                setConfirm({ type: "team", id: team.id, name: team.name })
                              }
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr className="border-t border-subtle bg-black/10">
                          <td className="px-4 py-4" colSpan={6}>
                            <div className="rounded border border-subtle bg-primary/50 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase text-muted">
                                    Manage Players
                                  </p>
                                  <h2 className="mt-1 text-lg font-black uppercase text-white">
                                    {team.name}
                                  </h2>
                                </div>
                                <button
                                  className={actionButtonClass()}
                                  disabled={isPending}
                                  type="button"
                                  onClick={() => openAddPlayer(team.id)}
                                >
                                  <UserPlus size={15} />
                                  Add Player
                                </button>
                              </div>

                              <div className="mt-4 overflow-x-auto rounded border border-subtle">
                                <table className="min-w-[760px] w-full text-left">
                                  <thead className="bg-field text-xs uppercase text-muted">
                                    <tr>
                                      <th className="px-4 py-3">Jersey Number</th>
                                      <th className="px-4 py-3">Name</th>
                                      <th className="px-4 py-3 text-center">Goals Total</th>
                                      <th className="px-4 py-3 text-center">Saves Total</th>
                                      <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {team.players.length === 0 ? (
                                      <tr>
                                        <td
                                          className="px-4 py-5 text-sm font-semibold text-muted"
                                          colSpan={5}
                                        >
                                          No players added yet.
                                        </td>
                                      </tr>
                                    ) : (
                                      team.players.map((player) => (
                                        <tr className="border-t border-subtle" key={player.id}>
                                          <td className="px-4 py-3 text-sm font-black text-white">
                                            {player.jerseyNumber === null
                                              ? "Unassigned"
                                              : player.jerseyNumber}
                                          </td>
                                          <td className="px-4 py-3 text-sm font-semibold text-white">
                                            {player.name}
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm font-semibold text-muted">
                                            {player.goalsTotal}
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm font-semibold text-muted">
                                            {player.savesTotal}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                              <button
                                                className={actionButtonClass()}
                                                disabled={isPending}
                                                type="button"
                                                onClick={() => openEditPlayer(team.id, player)}
                                              >
                                                <Pencil size={14} />
                                                Edit
                                              </button>
                                              <button
                                                className={actionButtonClass("danger")}
                                                disabled={isPending}
                                                type="button"
                                                onClick={() =>
                                                  setConfirm({
                                                    type: "player",
                                                    id: player.id,
                                                    name: player.name,
                                                  })
                                                }
                                              >
                                                <Trash2 size={14} />
                                                Remove
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {playerForm?.teamId === team.id ? (
                                <form className="mt-4 rounded border border-subtle bg-card p-4" onSubmit={onSavePlayer}>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold uppercase text-muted">
                                        {playerForm.id ? "Edit Player" : "Add Player"}
                                      </p>
                                      <h3 className="mt-1 text-base font-black uppercase text-white">
                                        {team.name}
                                      </h3>
                                    </div>
                                    <button
                                      className="icon-button h-8 w-8"
                                      type="button"
                                      onClick={() => setPlayerForm(null)}
                                      aria-label="Close player form"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                                    <label className="grid gap-2 text-sm font-bold text-white">
                                      Name
                                      <input
                                        className="form-input"
                                        value={playerForm.name}
                                        onChange={(event) =>
                                          setPlayerForm((current) =>
                                            current
                                              ? { ...current, name: event.target.value }
                                              : current
                                          )
                                        }
                                      />
                                    </label>
                                    <label className="grid gap-2 text-sm font-bold text-white">
                                      Jersey Number
                                      <input
                                        className="form-input"
                                        min={0}
                                        max={999}
                                        type="number"
                                        value={playerForm.jerseyNumber}
                                        onChange={(event) =>
                                          setPlayerForm((current) =>
                                            current
                                              ? { ...current, jerseyNumber: event.target.value }
                                              : current
                                          )
                                        }
                                      />
                                    </label>
                                    <div className="flex items-end">
                                      <button
                                        className={`${actionButtonClass("primary")} w-full`}
                                        disabled={isPending}
                                        type="submit"
                                      >
                                        Save Player
                                      </button>
                                    </div>
                                  </div>

                                  {playerError ? (
                                    <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
                                      {playerError}
                                    </p>
                                  ) : null}
                                </form>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {teamForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <form
            className="w-full max-w-lg rounded-lg border border-subtle bg-primary p-5 shadow-glass"
            onSubmit={onSaveTeam}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted">
                  {teamForm.id ? "Edit Team" : "Add Team"}
                </p>
                <h2 className="mt-1 text-xl font-black uppercase text-white">Team Details</h2>
              </div>
              <button
                className="icon-button h-8 w-8"
                type="button"
                onClick={() => setTeamForm(null)}
                aria-label="Close team form"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-white">
                Team Name
                <input
                  className="form-input"
                  value={teamForm.name}
                  onChange={(event) =>
                    setTeamForm((current) =>
                      current ? { ...current, name: event.target.value } : current
                    )
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-white">
                Group
                <input
                  className="form-input"
                  placeholder="Group A"
                  value={teamForm.group}
                  onChange={(event) =>
                    setTeamForm((current) =>
                      current ? { ...current, group: event.target.value } : current
                    )
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-white">
                Contact Detail
                <input
                  className="form-input"
                  placeholder="Phone or email"
                  value={teamForm.contactDetail}
                  onChange={(event) =>
                    setTeamForm((current) =>
                      current ? { ...current, contactDetail: event.target.value } : current
                    )
                  }
                />
              </label>
            </div>

            {teamError ? (
              <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
                {teamError}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                className={actionButtonClass()}
                type="button"
                onClick={() => setTeamForm(null)}
              >
                Cancel
              </button>
              <button className={actionButtonClass("primary")} disabled={isPending} type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-lg border border-subtle bg-primary p-5 shadow-glass">
            <ShieldAlert className="text-amber-300" size={28} />
            <h2 className="mt-4 text-lg font-black uppercase text-white">Confirm Delete</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              {confirm.type === "team"
                ? `Delete ${confirm.name} and all their players? This cannot be undone.`
                : `Remove ${confirm.name}? This cannot be undone.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={actionButtonClass()} type="button" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className={actionButtonClass("danger")}
                disabled={isPending}
                type="button"
                onClick={onConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
