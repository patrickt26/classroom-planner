import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentAcceptance } from "@/features/legal/queries";
import { createClient, getAuthenticatedUserId } from "@/lib/supabase/server";

export const requireTeacherWorkspace = cache(async () => {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/entrar");
  if (!(await getCurrentAcceptance())) redirect("/aceitar-termos");
  const client = await createClient();
  const { data, error } = await client
    .from("memberships")
    .select("workspaces(workspace_id,name,brand,time_zone,week_start)")
    .eq("user_id", userId)
    .eq("role", "teacher")
    .order("workspace_id")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o espaço.");
  if (!data?.workspaces) redirect("/entrar?aviso=acesso");
  return data.workspaces;
});
