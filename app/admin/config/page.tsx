import { createClient } from "@/lib/supabase/server";
import { ConfigAdminClient, type ConfigMap } from "./ConfigAdminClient";

export const dynamic = "force-dynamic";

const defaults: ConfigMap = {
  site_locked: "true",
  unlock_date: "2026-05-15T18:00:00+05:30",
  event_date_display: "25-30 May",
  whatsapp_link: "https://wa.me/",
  announcement_banner: "",
  prize_pool: "Rs 4500",
  fillout_link: "",
  leaderboard_visible: "false",
};

export default async function AdminConfigPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_config").select("key,value");
  const config = {
    ...defaults,
    ...Object.fromEntries((data ?? []).map((row) => [row.key, row.value])),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase text-muted">Site-wide CMS</p>
        <h1 className="mt-2 text-3xl font-black uppercase text-white">Site Config</h1>
      </div>

      <ConfigAdminClient initialConfig={config} />
    </div>
  );
}
