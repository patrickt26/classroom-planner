"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { lessonFormSchema } from "./agenda-schema";
import { agendaHref, localLessonDateTime } from "./calendar";
import type { LessonFormState, LessonFormValues } from "./form-state";

function readText(form: FormData, key: keyof LessonFormValues) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveLesson(
  id: string | null,
  previous: LessonFormState,
  form: FormData,
): Promise<LessonFormState> {
  const values: LessonFormValues = {
    student_id: readText(form, "student_id"),
    subject_id: readText(form, "subject_id"),
    date: readText(form, "date"),
    time: readText(form, "time"),
    duration_minutes: readText(form, "duration_minutes"),
    modality: readText(form, "modality"),
    meeting_url: readText(form, "meeting_url"),
    status: id ? readText(form, "status") : "agendada",
  };
  const state = { values, attempt: previous.attempt + 1 };
  const parsed = lessonFormSchema.safeParse(values);
  if (!parsed.success)
    return { ...state, errors: z.flattenError(parsed.error).fieldErrors };

  const lessonId = z.uuid().nullable().safeParse(id);
  if (!lessonId.success) return { ...state, message: "Aula inválida." };

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const lesson = parsed.data;
  const { data: conflict, error } = await client.rpc("save_lesson", {
    target_workspace_id: workspace.workspace_id,
    target_lesson_id: lessonId.data ?? undefined,
    lesson_student_id: lesson.student_id,
    lesson_subject_id: lesson.subject_id,
    lesson_starts_at: lesson.starts_at,
    lesson_duration_minutes: lesson.duration_minutes,
    lesson_modality: lesson.modality,
    lesson_meeting_url: lesson.meeting_url ?? undefined,
    lesson_status: lesson.status,
  });

  if (error?.code === "23503") {
    return {
      ...state,
      message:
        "O aluno ou a disciplina não está disponível. Confira a seleção.",
    };
  }
  if (error)
    return {
      ...state,
      message: "Não foi possível salvar a aula. Tente novamente.",
    };
  if (conflict === null)
    return {
      ...state,
      message: "Esta aula não está mais disponível para edição.",
    };

  revalidatePath("/agenda");
  redirect(agendaHref(values.date, conflict ? "conflito" : "salva"));
}

export async function cancelLesson(id: string, _: string): Promise<string> {
  const lessonId = z.uuid().safeParse(id);
  if (!lessonId.success) return "Aula inválida.";

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("lessons")
    .update({ status: "cancelada" })
    .eq("workspace_id", workspace.workspace_id)
    .eq("id", lessonId.data)
    .is("recurrence_id", null)
    .is("rescheduled_from_id", null)
    .neq("status", "cancelada")
    .neq("status", "reposicao_pendente")
    .select("starts_at")
    .maybeSingle();

  if (error) return "Não foi possível cancelar a aula. Tente novamente.";
  if (!data) return "Esta aula não está mais disponível para cancelamento.";

  revalidatePath("/agenda");
  redirect(
    agendaHref(
      localLessonDateTime(new Date(data.starts_at)).slice(0, 10),
      "cancelada",
    ),
  );
}
