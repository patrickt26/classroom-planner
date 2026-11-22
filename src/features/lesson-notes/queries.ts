import { notFound } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function getPreviousLessonNote(
  client: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  lesson: { student_id: string; starts_at: string },
) {
  const { data, error } = await client
    .from("lessons")
    .select(
      "id, notes:lesson_notes!lesson_notes_workspace_id_lesson_id_fkey!inner(difficulties, next_steps)",
    )
    .eq("workspace_id", workspaceId)
    .eq("student_id", lesson.student_id)
    .lt("starts_at", lesson.starts_at)
    .order("starts_at", { ascending: false })
    .order("id")
    .order("id", { ascending: false, referencedTable: "notes" })
    .limit(1, { referencedTable: "notes" })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o registro anterior.");

  const note = data?.notes[0];
  return data && note ? { lessonId: data.id, ...note } : null;
}

export async function getLessonNotes(id: string) {
  const lessonId = z.uuid().safeParse(id);
  if (!lessonId.success) notFound();

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data: lesson, error } = await client
    .from("lessons")
    .select(
      "student_id, starts_at, status, students!lessons_workspace_id_student_id_fkey(name), subjects!lessons_workspace_id_subject_id_fkey(name)",
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

  const previousNote = await getPreviousLessonNote(
    client,
    workspace.workspace_id,
    lesson,
  );
  return { lesson, notes, previousNote, timeZone: workspace.time_zone };
}
