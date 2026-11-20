import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export async function updateSession(
  request: NextRequest,
  requiresSession: boolean,
) {
  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(cacheHeaders)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (requiresSession && !data?.claims.sub) {
    const login = NextResponse.redirect(new URL("/entrar", request.url));
    for (const cookie of response.cookies.getAll()) login.cookies.set(cookie);
    login.headers.set("Cache-Control", "private, no-store");
    return login;
  }

  return response;
}
