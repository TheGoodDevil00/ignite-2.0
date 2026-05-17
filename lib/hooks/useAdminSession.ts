"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type AdminProfile = Pick<Tables<"profiles">, "id" | "email" | "role" | "full_name">;

export function useAdminSession() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      setError(null);

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,full_name,role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError || !["admin", "scorer"].includes(currentProfile?.role ?? "")) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setError(profileError?.message ?? "Admin or scorer access is required.");
      } else {
        setUser(currentUser);
        setProfile(currentProfile);
      }

      setLoading(false);
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    profile,
    loading,
    error,
    signOut,
  };
}
