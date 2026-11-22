import { notFound } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function getLessonNotes(id: string) {
  const lessonId = z.uuid().safeParse(id);
  if (!lessonId.success) notFound();

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data: lesson, error } = await client
    .from("lessons")
    .select(
      "starts_at, status, students!lessons_workspace_id_student_id_fkey(name), subjects!lessons_workspace_id_subject_id_fkey(name)",
    )
    .eq("workspace_id", workspace.workspace_id)
    .eq("id", lessonId.data)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a aula.");
  if (!lesson) notFound();

  const notes = [];
  const pageSize = 100;
  let before: number | undefined;
  for (;;) {
    const query = client
      .from("lesson_notes")
      .select("id, worked_on, difficulties, next_steps, created_at")
      .eq("workspace_id", workspace.workspace_id)
      .eq("lesson_id", lessonId.data)
      .order("id", { ascending: false })
      .limit(pageSize);
    const { data, error } = await (before === undefined
      ? query
      : query.lt("id", before));
    if (error) throw new Error("Não foi possível carregar o histórico.");
    notes.push(...data);
    if (data.length < pageSize) break;
    before = data.at(-1)?.id;
  }

  if (
    notes.length === 0 &&
    lesson.status !== "agendada" &&
    lesson.status !== "confirmada" &&
    lesson.status !== "realizada"
  )
    notFound();

  return { lesson, notes, timeZone: workspace.time_zone };
}
