"use client";

import { ChangeEvent, FocusEvent, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updateConfigValue } from "@/app/admin/actions";

export type ConfigMap = Record<string, string>;

const controls = [
  {
    key: "site_locked",
    label: "Site Locked",
    type: "toggle",
  },
  {
    key: "unlock_date",
    label: "Unlock Date",
    type: "datetime",
  },
  {
    key: "event_date_display",
    label: "Event Date Display",
    type: "text",
  },
  {
    key: "whatsapp_link",
    label: "WhatsApp Link",
    type: "url",
  },
  {
    key: "announcement_banner",
    label: "Announcement Banner",
    type: "text",
  },
  {
    key: "prize_pool",
    label: "Prize Pool",
    type: "text",
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
    const value = event.currentTarget.checked ? "true" : "false";
    setValue("site_locked", value);
    save("site_locked", value);
  }

  return (
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
            </div>

            {control.type === "toggle" ? (
              <label className="inline-flex w-fit items-center gap-3">
                <input
                  className="h-5 w-5 accent-[var(--color-accent-red)]"
                  type="checkbox"
                  checked={(values.site_locked ?? "false") === "true"}
                  onChange={onToggle}
                />
                <span className="text-sm font-bold text-muted">
                  {(values.site_locked ?? "false") === "true" ? "Locked" : "Unlocked"}
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
    </div>
  );
}
