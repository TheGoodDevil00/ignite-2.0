import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "../lib/supabase/types";

type Account = {
  username: string;
  email: string;
  passwordEnv: string;
  role: UserRole;
  fullName: string;
};

const accounts: Account[] = [
  {
    username: "admin",
    email: "admin@ignite.local",
    passwordEnv: "ADMIN_PASSWORD",
    role: "admin",
    fullName: "IGNITE Admin",
  },
  {
    username: "scorer",
    email: "scorer@ignite.local",
    passwordEnv: "SCORER_PASSWORD",
    role: "scorer",
    fullName: "IGNITE Scorer",
  },
];

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    process.env[key] ??= value;
  }
}

async function findUserByEmail(
  supabase: ReturnType<typeof createClient<Database>>,
  email: string
) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase()
    );

    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }
}

async function ensureAccount(
  supabase: ReturnType<typeof createClient<Database>>,
  account: Account
) {
  const password = process.env[account.passwordEnv];
  const existing = await findUserByEmail(supabase, account.email);

  if (!existing && !password) {
    console.warn(
      `Skipped ${account.username}: set ${account.passwordEnv} in .env.local first.`
    );
    return;
  }

  const user =
    existing ??
    (
      await supabase.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      })
    ).data.user;

  if (!user) {
    throw new Error(`Could not create ${account.username}.`);
  }

  if (existing && password) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });

    if (error) throw error;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
    },
    { onConflict: "id" }
  );

  if (profileError) throw profileError;

  console.log(`Ready: username "${account.username}" (${account.role})`);
}

async function main() {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const account of accounts) {
    await ensureAccount(supabase, account);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
