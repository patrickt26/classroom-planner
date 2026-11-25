import { notFound } from "next/navigation";
import { z } from "zod";
import { getCatalogOptions } from "@/features/catalog/queries";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

const pageSize = 24;
const listFiltersSchema = z.object({
  busca: z.string().trim().max(100).catch(""),
  situacao: z.enum(["ativos", "arquivados"]).catch("ativos"),
  pagina: z
    .string()
    .regex(/^\d{1,6}$/)
    .transform(Number)
    .pipe(z.int().positive())
    .catch(1),
});

export async function listStudents(input: Record<string, unknown>) {
  const filters = listFiltersSchema.parse(input);
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const start = (filters.pagina - 1) * pageSize;
  let query = client
    .from("students")
    .select(
      "id, name, hourly_rate, is_free, grades(name), student_subjects(subjects(name))",
    )
    .eq("workspace_id", workspace.workspace_id);
  query =
    filters.situacao === "arquivados"
      ? query.not("archived_at", "is", null)
      : query.is("archived_at", null);
  if (filters.busca) {
    query = query.filter(
      "name",
      "imatch",
      filters.busca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
  }
  const { data, error } = await query
    .order("name")
    .order("id")
    .range(start, start + pageSize);
  if (error) throw new Error("Não foi possível carregar os alunos.");
  return {
    filters,
    students: data.slice(0, pageSize),
    hasNextPage: data.length > pageSize,
  };
}

export async function getStudentOptions(
  currentGradeId?: string | null,
  currentSubjectIds?: string[],
) {
  const [grades, subjects] = await Promise.all([
    getCatalogOptions("grades", currentGradeId ? [currentGradeId] : []),
    getCatalogOptions("subjects", currentSubjectIds),
  ]);
  return { grades, subjects };
}

export async function getStudent(id: string) {
  const studentId = z.uuid().safeParse(id);
  if (!studentId.success) notFound();
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("students")
    .select(
      "id, name, birth_date, grade_id, school, hourly_rate, is_free, notes, archived_at, guardian_consent_at, grades(name), student_subjects(subject_id, subjects(name))",
    )
    .eq("workspace_id", workspace.workspace_id)
    .eq("id", studentId.data)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o cadastro.");
  if (!data) notFound();
  return data;
}
