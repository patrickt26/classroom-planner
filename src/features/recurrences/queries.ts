import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function listRecurrences(today: string) {
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("recurrences")
    .select("*,students(name),subjects(name)")
    .eq("workspace_id", ws.workspace_id)
    .is("ended_at", null)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("day_of_week")
    .order("start_time");
  if (error) throw new Error("Não foi possível carregar as recorrências.");
  return data;
}

export async function listPendingMakeups() {
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("lessons")
    .select(
      "id,starts_at,students!lessons_workspace_id_student_id_fkey(name),subjects!lessons_workspace_id_subject_id_fkey(name)",
    )
    .eq("workspace_id", ws.workspace_id)
    .eq("status", "reposicao_pendente")
    .order("starts_at");
  if (error)
    throw new Error("Não foi possível carregar as reposições pendentes.");
  return data;
}
