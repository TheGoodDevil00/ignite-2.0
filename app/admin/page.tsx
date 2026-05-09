import Link from "next/link";
import { CalendarDays, ListChecks, RadioTower, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type CountCard = {
  label: string;
  value: number;
  icon: typeof Users;
};

async function countRows(
  table: "teams" | "matches",
  options?: {
    status?: MatchStatus;
    start?: string;
    end?: string;
  }
) {
  const supabase = await createClient();

  if (table === "teams") {
    const { count } = await supabase
      .from("teams")
      .select("id", { count: "exact", head: true });
    return count ?? 0;
  }

  let query = supabase.from("matches").select("id", { count: "exact", head: true });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.start) {
    query = query.gte("estimated_start", options.start);
  }

  if (options?.end) {
    query = query.lt("estimated_start", options.end);
  }

  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [totalTeams, totalMatches, matchesToday, completedMatches] =
    await Promise.all([
      countRows("teams"),
      countRows("matches"),
      countRows("matches", {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
      }),
      countRows("matches", { status: "completed" }),
    ]);

  const cards: CountCard[] = [
    { label: "Total Teams", value: totalTeams, icon: Users },
    { label: "Total Matches", value: totalMatches, icon: CalendarDays },
    { label: "Matches Today", value: matchesToday, icon: RadioTower },
    { label: "Completed", value: completedMatches, icon: Trophy },
  ];

  const actions = [
    {
      label: "Generate Fixtures",
      href: "/admin/fixtures",
      description: "Seed teams and create the group stage schedule.",
      icon: CalendarDays,
    },
    {
      label: "Go Live",
      href: "/admin/fixtures",
      description: "Move a scheduled match into live status.",
      icon: RadioTower,
    },
    {
      label: "Update Score",
      href: "/admin/scores",
      description: "Enter match scores and complete fixtures.",
      icon: ListChecks,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase text-muted">Tournament control</p>
        <h1 className="mt-2 text-3xl font-black uppercase text-white">Dashboard</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-lg border border-subtle bg-card p-5 shadow-glass" key={card.label}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase text-muted">{card.label}</p>
                <Icon size={20} className="text-accent" />
              </div>
              <p className="mt-4 text-4xl font-black text-white">{card.value}</p>
            </article>
          );
        })}
      </section>

      <section>
        <h2 className="text-lg font-black uppercase text-white">Quick Actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                href={action.href}
                key={action.label}
                className="rounded-lg border border-subtle bg-card p-5 transition hover:border-accent"
              >
                <Icon size={24} className="text-accent" />
                <p className="mt-4 text-base font-black uppercase text-white">{action.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
