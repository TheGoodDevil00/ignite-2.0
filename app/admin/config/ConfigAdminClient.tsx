"use client";

import { ChangeEvent, FocusEvent, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Trash2, X } from "lucide-react";
import { resetTournamentData, updateConfigValue } from "@/app/admin/actions";

export type ConfigMap = Record<string, string>;

const controls = [
  {
    key: "site_locked",
    label: "Site Locked",
    type: "toggle",
    help: "",
  },
  {
    key: "unlock_date",
    label: "Unlock Date",
    type: "datetime",
    help: "",
  },
  {
    key: "event_date_display",
    label: "Event Date Display",
    type: "text",
    help: "",
  },
  {
    key: "whatsapp_link",
    label: "WhatsApp Link",
    type: "url",
    help: "",
  },
  {
    key: "announcement_banner",
    label: "Announcement Banner",
    type: "text",
    help: "",
  },
  {
    key: "prize_pool",
    label: "Prize Pool",
    type: "text",
    help: "",
  },
  {
    key: "fillout_link",
    label: "Registration Form Link",
    type: "url",
    help: "Paste your Fillout form URL here. This powers the REGISTER NOW button site-wide. Leave empty to hide the button.",
  },
  {
    key: "leaderboard_visible",
    label: "Show Leaderboard on Homepage",
    type: "toggle",
    help: "When off, the leaderboard section is completely hidden and surrounding sections reflow automatically.",
  },
] as const;

function toDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function ConfigAdminClient({ initialConfig }: { initialConfig: ConfigMap }) {
  const [values, setValues] = useState(initialConfig);
  const [savedKeys, setSavedKeys] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayValues: ConfigMap = useMemo(
    () => ({
      ...values,
      unlock_date: toDateTimeLocal(values.unlock_date ?? ""),
    }),
    [values]
  );

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function save(key: string, value: string) {
    setSavedKeys((current) => ({ ...current, [key]: "saving" }));

    startTransition(async () => {
      const result = await updateConfigValue(key, value);
      setSavedKeys((current) => ({
        ...current,
        [key]: result.ok ? "saved" : "error",
      }));
    });
  }

  function onBlur(event: FocusEvent<HTMLInputElement>) {
    const key = event.currentTarget.name;
    const rawValue = event.currentTarget.value;
    const value = key === "unlock_date" ? fromDateTimeLocal(rawValue) : rawValue;
    setValue(key, value);
    save(key, value);
  }

  function onToggle(event: ChangeEvent<HTMLInputElement>) {
    const key = event.currentTarget.name;
    const value = event.currentTarget.checked ? "true" : "false";
    setValue(key, value);
    save(key, value);
  }

  function clearResetForm() {
    setResetIdentifier("");
    setResetPassword("");
    setResetConfirmation("");
  }

  function closeReset() {
    setResetOpen(false);
    setResetMessage(null);
    clearResetForm();
  }

  function submitReset() {
    setResetMessage(null);

    startTransition(async () => {
      const result = await resetTournamentData({
        identifier: resetIdentifier,
        password: resetPassword,
        confirmation: resetConfirmation,
      });

      setResetMessage(result.message);

      if (result.ok) {
        clearResetForm();
      }
    });
  }

  return (
    <>
      <div className="grid gap-4">
        {controls.map((control) => {
        const state = savedKeys[control.key] ?? "idle";

        return (
          <div
            className="grid gap-4 rounded-lg border border-subtle bg-card p-4 shadow-glass sm:grid-cols-[220px_1fr_auto] sm:items-center"
            key={control.key}
          >
            <div>
              <p className="text-sm font-black uppercase text-white">{control.label}</p>
              <p className="mt-1 text-xs font-semibold text-muted">{control.key}</p>
              {control.help ? (
                <p className="mt-2 text-xs leading-5 text-muted">{control.help}</p>
              ) : null}
            </div>

            {control.type === "toggle" ? (
              <label className="inline-flex w-fit items-center gap-3">
                <input
                  className="peer sr-only"
                  name={control.key}
                  type="checkbox"
                  checked={(values[control.key] ?? "false") === "true"}
                  onChange={onToggle}
                />
                <span className="relative h-6 w-11 rounded-full border border-subtle bg-field transition after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-muted after:transition peer-checked:border-accent peer-checked:bg-accent/20 peer-checked:after:translate-x-5 peer-checked:after:bg-white" />
                <span className="text-sm font-bold text-muted">
                  {control.key === "site_locked"
                    ? (values[control.key] ?? "false") === "true"
                      ? "Locked"
                      : "Unlocked"
                    : (values[control.key] ?? "false") === "true"
                      ? "Shown"
                      : "Hidden"}
                </span>
              </label>
            ) : (
              <input
                className="form-input"
                name={control.key}
                type={control.type === "datetime" ? "datetime-local" : control.type}
                value={displayValues[control.key] ?? ""}
                onChange={(event) =>
                  setValue(
                    control.key,
                    control.type === "datetime"
                      ? fromDateTimeLocal(event.target.value)
                      : event.target.value
                  )
                }
                onBlur={onBlur}
              />
            )}

            <div className="flex min-w-20 items-center gap-2 text-xs font-bold uppercase text-muted">
              {state === "saving" || isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Saving
                </>
              ) : state === "saved" ? (
                <>
                  <CheckCircle2 size={14} className="text-accent" />
                  Saved
                </>
              ) : state === "error" ? (
                "Error"
              ) : (
                "Ready"
              )}
            </div>
          </div>
        );
      })}
        <section className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 shadow-glass">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-black uppercase text-white">Danger Zone</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Clear all teams, players, fixtures, match scores, and player match stats from
                Supabase. Site configuration and admin accounts are preserved.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded border border-red-400/50 bg-red-500/20 px-4 text-xs font-black uppercase text-red-100 transition hover:border-red-300 disabled:opacity-60"
              disabled={isPending}
              onClick={() => {
                setResetOpen(true);
                setResetMessage(null);
              }}
            >
              <Trash2 size={15} />
              Clear Data
            </button>
          </div>
          {resetMessage && !resetOpen ? (
            <p className="mt-3 text-sm font-semibold text-red-100">{resetMessage}</p>
          ) : null}
        </section>
      </div>

      {resetOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-red-500/40 bg-primary p-5 shadow-glass">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-red-200">Re-auth required</p>
                <h2 className="mt-1 text-xl font-black uppercase text-white">
                  Clear Tournament Data
                </h2>
              </div>
              <button
                className="icon-button h-8 w-8"
                type="button"
                onClick={closeReset}
                aria-label="Close clear data dialog"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-muted">
              This deletes teams, players, fixtures, match scores, and live player stats from
              Supabase. Enter the same admin credentials you used to sign in, then type CLEAR.
            </p>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-bold text-white">
                Admin username or email
                <input
                  className="form-input"
                  autoComplete="username"
                  value={resetIdentifier}
                  onChange={(event) => setResetIdentifier(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-white">
                Admin password
                <input
                  className="form-input"
                  autoComplete="current-password"
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-white">
                Type CLEAR
                <input
                  className="form-input"
                  value={resetConfirmation}
                  onChange={(event) => setResetConfirmation(event.target.value)}
                />
              </label>
            </div>

            {resetMessage ? (
              <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
                {resetMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="inline-flex h-10 items-center justify-center rounded border border-subtle bg-field px-4 text-xs font-bold uppercase text-muted" type="button" onClick={closeReset}>
                Cancel
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded bg-accent px-4 text-xs font-black uppercase text-white disabled:opacity-60"
                disabled={isPending}
                type="button"
                onClick={submitReset}
              >
                {isPending ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                Clear Data
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
