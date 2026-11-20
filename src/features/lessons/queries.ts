import { notFound } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { addDays, calendarDayStart } from "./calendar";

export function canEditLesson(
  lesson: Pick<
    Tables<"lessons">,
    "recurrence_id" | "rescheduled_from_id" | "status"
  >,
) {
  return (
    !lesson.recurrence_id &&
    !lesson.rescheduled_from_id &&
    lesson.status !== "cancelada" &&
    lesson.status !== "reposicao_pendente"
  );
}

export async function listWeekLessons(week: string) {
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const start = calendarDayStart(week);
  const end = calendarDayStart(addDays(week, 7));
  const query = client
    .from("lessons")
    .select(
      "id, starts_at, duration_minutes, modality, meeting_url, status, recurrence_id, rescheduled_from_id, students!lessons_workspace_id_student_id_fkey(name), subjects!lessons_workspace_id_subject_id_fkey(name)",
    )
    .eq("workspace_id", workspace.workspace_id)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at")
    .order("id");

  const pageSize = 500;
  const lessons = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw new Error("Não foi possível carregar as aulas da semana.");
    lessons.push(...data);
    if (data.length < pageSize) return lessons;
  }
}

export async function getEditableLesson(id: string) {
  const lessonId = z.uuid().safeParse(id);
  if (!lessonId.success) notFound();

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("lessons")
    .select(
      "id, student_id, subject_id, starts_at, duration_minutes, modality, meeting_url, status, recurrence_id, rescheduled_from_id",
    )
    .eq("workspace_id", workspace.workspace_id)
    .eq("id", lessonId.data)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a aula.");
  if (!data || !canEditLesson(data)) notFound();
  return data;
}

export async function getLessonOptions(currentStudentId?: string) {
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const studentsQuery = client
    .from("students")
    .select("id, name")
    .eq("workspace_id", workspace.workspace_id);
  const [students, subjects] = await Promise.all([
    (currentStudentId
      ? studentsQuery.or(`archived_at.is.null,id.eq.${currentStudentId}`)
      : studentsQuery.is("archived_at", null)
    ).order("name"),
    client
      .from("subjects")
      .select("id, name")
      .eq("workspace_id", workspace.workspace_id)
      .order("name"),
  ]);
  if (students.error || subjects.error)
    throw new Error("Não foi possível carregar alunos e disciplinas.");
  return { students: students.data, subjects: subjects.data };
}

export type WeekLesson = Awaited<ReturnType<typeof listWeekLessons>>[number];
