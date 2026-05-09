"use client";

import { useFormState, useFormStatus } from "react-dom";
import { WandSparkles } from "lucide-react";
import { runFixtureGenerator } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded bg-accent px-4 py-2 text-xs font-bold uppercase text-white transition disabled:opacity-60"
    >
      <WandSparkles size={15} />
      {pending ? "Running..." : "Run Fixture Generator"}
    </button>
  );
}

export function RunFixtureGeneratorButton() {
  const [state, formAction] = useFormState(runFixtureGenerator, null);

  return (
    <form action={formAction} className="rounded-lg border border-subtle bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-white">Fixture Generator</p>
          <p className="mt-1 text-sm text-muted">
            Builds fixtures from the registered teams in the database.
          </p>
        </div>
        <SubmitButton />
      </div>
      {state?.message ? (
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-field p-3 text-xs text-muted">
          {state.message}
        </pre>
      ) : null}
    </form>
  );
}
