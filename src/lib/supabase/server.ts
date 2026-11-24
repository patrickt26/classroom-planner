import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export async function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can only read cookies. Use updateSession in Proxy to refresh them.
        }
      },
    },
  });
}

export const getAuthenticatedUserId = cache(async () => {
  const client = await createClient();
  const { data } = await client.auth.getClaims();
  return data?.claims.sub;
});
