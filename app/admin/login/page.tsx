"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account is not an IGNITE admin.");
      setLoading(false);
      return;
    }

    const redirectedFrom = searchParams.get("redirectedFrom");
    router.replace(redirectedFrom?.startsWith("/admin") ? redirectedFrom : "/admin");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-primary px-4 text-text">
      <div className="w-full max-w-md rounded-lg border border-subtle bg-card p-6 shadow-glass backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <Image src="/icons/logo.png" alt="" width={72} height={72} priority />
          <h1 className="mt-4 font-display text-6xl italic leading-none">
            IGNITE <span className="text-accent">2.0</span>
          </h1>
          <p className="mt-2 text-xs font-bold uppercase text-muted">Admin login</p>
        </div>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          <label className="relative block">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              className="form-input h-12 pl-10"
              name="email"
              type="email"
              placeholder="Admin email"
              autoComplete="email"
              required
            />
          </label>

          <label className="relative block">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              className="form-input h-12 pl-10"
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="primary-pill mt-2 h-11" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Log In"}
          </button>

          {error ? (
            <p className="rounded border border-accent/50 bg-accent/10 px-3 py-2 text-sm font-semibold text-white">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
