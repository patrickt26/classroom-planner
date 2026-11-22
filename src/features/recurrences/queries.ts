import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function listStudentRecurrences(studentId: string, today: string) {
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("recurrences")
    .select("id,day_of_week,start_time,subjects(name)")
    .eq("workspace_id", ws.workspace_id)
    .eq("student_id", studentId)
    .is("ended_at", null)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("day_of_week")
    .order("start_time");
  if (error) throw new Error("Não foi possível carregar as recorrências.");
  return data;
}

export async function getActiveRecurrence(id: string, today: string) {
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("recurrences")
    .select("*,students(name)")
    .eq("workspace_id", ws.workspace_id)
    .eq("id", id)
    .is("ended_at", null)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a série.");
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

export async function countPendingMakeups(workspaceId: string) {
  const client = await createClient();
  const { count, error } = await client
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "reposicao_pendente");
  if (error)
    throw new Error("Não foi possível contar as reposições pendentes.");
  return count ?? 0;
}
