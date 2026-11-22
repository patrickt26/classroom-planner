import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function listStudentGuardians(studentId: string) {
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("student_guardians")
    .select(
      "guardian_id, relationship, is_financial_guardian, guardians!inner(name, phone)",
    )
    .eq("workspace_id", workspace.workspace_id)
    .eq("student_id", studentId);

  if (error) throw new Error("Não foi possível carregar os responsáveis.");
  return data.sort(
    (a, b) =>
      Number(b.is_financial_guardian) - Number(a.is_financial_guardian) ||
      a.guardians.name.localeCompare(b.guardians.name, "pt-BR"),
  );
}

async function availableGuardians(studentId: string) {
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  return {
    query: client
      .from("guardians")
      .select("id, name, phone, links:student_guardians()")
      .eq("workspace_id", workspace.workspace_id)
      .eq("links.student_id", studentId)
      .is("links", null),
  };
}

const pageSize = 10;

export async function searchAvailableGuardians(
  studentId: string,
  search: string,
  page: number,
) {
  const { query } = await availableGuardians(studentId);
  const start = (page - 1) * pageSize;
  const { data, error } = await query
    .filter("name", "imatch", search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .order("name")
    .order("id")
    .range(start, start + pageSize);

  if (error) throw new Error("Não foi possível buscar os responsáveis.");
  return {
    guardians: data.slice(0, pageSize),
    hasNext: data.length > pageSize,
  };
}

export async function getAvailableGuardian(
  studentId: string,
  guardianId: string,
) {
  const { query } = await availableGuardians(studentId);
  const { data, error } = await query.eq("id", guardianId).maybeSingle();

  if (error) throw new Error("Não foi possível carregar o responsável.");
  return data;
}
