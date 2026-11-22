import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

const pageSize = 6;
export const eventTypeSchema = z.enum([
  "aula",
  "registro",
  "falta",
  "reposicao",
]);

const timelineFiltersSchema = z.object({
  tipo: eventTypeSchema.optional().catch(undefined),
  historico: z
    .string()
    .regex(/^\d{1,6}$/)
    .transform(Number)
    .pipe(z.int().positive())
    .catch(1),
});

export async function listStudentTimeline(
  studentId: string,
  input: Record<string, unknown>,
) {
  const filters = timelineFiltersSchema.parse(input);
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const start = (filters.historico - 1) * pageSize;
  let query = client
    .from("student_timeline")
    .select("event_type, occurred_at, lesson_id, subject_name, status, summary")
    .eq("workspace_id", workspace.workspace_id)
    .eq("student_id", studentId)
    .lte("occurred_at", new Date().toISOString());
  if (filters.tipo) query = query.eq("event_type", filters.tipo);

  const { data, error } = await query
    .order("occurred_at", { ascending: false })
    .order("lesson_id")
    .order("event_type")
    .range(start, start + pageSize);
  if (error) throw new Error("Não foi possível carregar a linha do tempo.");

  return {
    events: data.slice(0, pageSize),
    filters,
    hasNextPage: data.length > pageSize,
  };
}
