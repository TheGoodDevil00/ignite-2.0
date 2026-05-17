import { createClient } from "@/lib/supabase/server";
import { mergeSiteConfig } from "@/lib/siteConfig";
import { ConfigAdminClient, type ConfigMap } from "./ConfigAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_config").select("key,value");
  const config = mergeSiteConfig(
    Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
  ) satisfies ConfigMap;

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
