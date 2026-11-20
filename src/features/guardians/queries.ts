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
