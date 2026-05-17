import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function redirectToScorerHome(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/fixtures";
  url.search = "";
  return NextResponse.redirect(url);
}

function isScorerRoute(pathname: string) {
  return (
    pathname === "/admin/fixtures" ||
    pathname.startsWith("/admin/fixtures/") ||
    pathname === "/admin/scores" ||
    pathname.startsWith("/admin/scores/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    return request.nextUrl.pathname.startsWith("/admin")
      ? redirectToLogin(request)
      : supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/admin/login");

  if (!isAdminRoute || isLoginRoute) {
    return supabaseResponse;
  }

  if (error || !userId) {
    return redirectToLogin(request);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    return supabaseResponse;
  }

  if (profile?.role === "scorer" && isScorerRoute(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  if (profile?.role === "scorer") {
    return redirectToScorerHome(request);
  }

  return redirectToLogin(request);
}
