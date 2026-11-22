import { notFound } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function getLessonPlanning(id: string, source: unknown) {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data: lesson, error } = await client
    .from("lessons")
    .select(
      "starts_at, students!lessons_workspace_id_student_id_fkey(name), subjects!lessons_workspace_id_subject_id_fkey(name), lesson_plans(objective, content, activities, materials)",
    )
    .eq("workspace_id", workspace.workspace_id)
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o planejamento.");
  if (!lesson) notFound();

  const sourceId = z.uuid().safeParse(source);
  const previousLessons = [];
  let copy = null;
  if (!lesson.lesson_plans) {
    const previous = client
      .from("lessons")
      .select(
        "id, starts_at, students!lessons_workspace_id_student_id_fkey(name), subjects!lessons_workspace_id_subject_id_fkey(name), lesson_plans!inner(lesson_id)",
      )
      .eq("workspace_id", workspace.workspace_id)
      .lt("starts_at", lesson.starts_at)
      .order("starts_at", { ascending: false })
      .order("id");

    const pageSize = 100;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await previous.range(
        offset,
        offset + pageSize - 1,
      );
      if (error)
        throw new Error("Não foi possível carregar os planos anteriores.");
      previousLessons.push(...data);
      if (data.length < pageSize) break;
    }

    if (
      sourceId.success &&
      previousLessons.some(({ id }) => id === sourceId.data)
    ) {
      const { data, error } = await client
        .from("lesson_plans")
        .select("objective, content, activities, materials")
        .eq("workspace_id", workspace.workspace_id)
        .eq("lesson_id", sourceId.data)
        .maybeSingle();
      if (error)
        throw new Error("Não foi possível carregar o plano para duplicação.");
      copy = data;
    }
  }
  return { lesson, previousLessons, copy, timeZone: workspace.time_zone };
}
