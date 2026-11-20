import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const requireTeacherWorkspace = cache(async () => {
  const client = await createClient();
  const { data: auth } = await client.auth.getClaims();
  if (!auth?.claims.sub) redirect("/entrar");
  const { data, error } = await client
    .from("memberships")
    .select("workspaces(workspace_id,name,brand)")
    .eq("user_id", auth.claims.sub)
    .eq("role", "teacher")
    .order("workspace_id")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o espaço.");
  if (!data?.workspaces) redirect("/entrar?aviso=acesso");
  return data.workspaces;
});
