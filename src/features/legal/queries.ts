import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient, getAuthenticatedUserId } from "@/lib/supabase/server";
import { legalVersion } from "./version";

export const getCurrentAcceptance = cache(async () => {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/entrar");

  const client = await createClient();
  const { data, error } = await client
    .from("terms_acceptances")
    .select("accepted_at,terms_version")
    .eq("user_id", userId)
    .eq("terms_version", legalVersion)
    .maybeSingle();
  if (error) throw new Error("Não foi possível consultar o aceite dos termos.");
  return data;
});
