"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { lessonFormSchema, weeklyLessonSchema } from "./agenda-schema";
import { agendaHref, localLessonDateTime } from "./calendar";
import type { LessonFormState } from "./form-state";

export async function saveLesson(
  id: string | null,
  returnStudentId: string | null,
  _: LessonFormState,
  form: FormData,
): Promise<LessonFormState> {
  const lessonId = z.uuid().nullable().safeParse(id);
  if (!lessonId.success) return { message: "Aula inválida." };
  const student = z.uuid().safeParse(form.get("student_id"));
  if (!student.success) return { studentError: "Selecione um aluno." };
  const keys = z
    .array(z.string().regex(/^\d+$/))
    .nonempty()
    .safeParse(form.getAll("day_id"));
  if (
    !keys.success ||
    new Set(keys.data).size !== keys.data.length ||
    (id && keys.data.length !== 1)
  )
    return { message: "Confira os dias da aula e tente novamente." };

  const workspace = await requireTeacherWorkspace();
  const schema = lessonFormSchema(workspace.time_zone);
  const days: NonNullable<LessonFormState["days"]> = {};
  const blocks = [];
  for (const key of keys.data) {
    const read = (field: string) => form.get(`day.${key}.${field}`) ?? "";
    const date = read("date");
    const time = read("time");
    const lesson = schema.safeParse({
      student_id: student.data,
      subject_id: read("subject_id"),
      date,
      time,
      duration_minutes: read("duration_minutes"),
      modality: read("modality"),
      meeting_url: read("meeting_url"),
      status: id ? read("status") : "agendada",
    });
    const weekly = weeklyLessonSchema.safeParse({
      repeat_weekly: id ? "" : read("repeat_weekly"),
      date,
      end_date: read("end_date"),
    });
    if (!lesson.success || !weekly.success) {
      days[key] = {
        fields: {
          ...(!lesson.success && z.flattenError(lesson.error).fieldErrors),
          ...(!weekly.success && z.flattenError(weekly.error).fieldErrors),
        },
      };
      continue;
    }
    const {
      subject_id,
      starts_at,
      duration_minutes,
      modality,
      meeting_url,
      status,
    } = lesson.data;
    blocks.push({
      date: String(date),
      status,
      schedule: {
        subject_id,
        starts_at,
        duration_minutes,
        modality,
        meeting_url: meeting_url ?? null,
        weekly: weekly.data.repeat_weekly === "on",
        end_date:
          weekly.data.repeat_weekly === "on"
            ? weekly.data.end_date || null
            : null,
      },
    });
  }
  if (Object.keys(days).length)
    return { days, message: "Confira os campos indicados." };

  const client = await createClient();
  const first = blocks[0];
  if (!id) {
    const confirmation = z
      .enum(["true", "false"])
      .safeParse(form.get("allow_conflicts") ?? "false");
    if (!confirmation.success) return { message: "Confirmação inválida." };
    const { data: conflict, error } = await client.rpc("create_lesson_days", {
      allow_conflicts: confirmation.data === "true",
      target_workspace_id: workspace.workspace_id,
      lesson_student_id: student.data,
      lesson_days: blocks.map((block) => block.schedule),
    });
    if (error) {
      const key = keys.data[Number(error.details) - 1];
      const isConflict =
        error.code === "23P01" && error.message === "lesson_day_conflict";
      return {
        message: "Nenhuma aula foi salva.",
        days: key
          ? {
              [key]: isConflict
                ? { conflict: true }
                : { message: "Confira os dados deste dia e tente novamente." },
            }
          : undefined,
      };
    }
    revalidatePath(`/alunos/${student.data}`);
    revalidatePath("/agenda");
    if (returnStudentId) {
      const notice = conflict ? "aula-conflito" : "aula-salva";
      redirect(`/alunos/${returnStudentId}?aviso=${notice}`);
    }
    if (conflict) {
      redirect(
        agendaHref(
          first.date,
          blocks.length > 1 ? "dias-conflito" : "conflito",
        ),
      );
    }
    redirect(
      agendaHref(
        first.date,
        blocks.length > 1
          ? "dias-salvos"
          : first.schedule.weekly
            ? "serie-salva"
            : "salva",
      ),
    );
  }

  const { data: conflict, error } = await client.rpc("save_lesson", {
    target_workspace_id: workspace.workspace_id,
    target_lesson_id: id,
    lesson_student_id: student.data,
    lesson_subject_id: first.schedule.subject_id,
    lesson_starts_at: first.schedule.starts_at,
    lesson_duration_minutes: first.schedule.duration_minutes,
    lesson_modality: first.schedule.modality,
    lesson_meeting_url: first.schedule.meeting_url ?? undefined,
    lesson_status: first.status,
  });
  if (error?.code === "23503")
    return {
      message:
        "O aluno ou a disciplina não está disponível. Confira a seleção.",
    };
  if (error)
    return { message: "Não foi possível salvar a aula. Tente novamente." };
  if (conflict === null)
    return { message: "Esta aula não está mais disponível para edição." };

  revalidatePath("/agenda");
  if (first.status === "realizada") {
    redirect(`/agenda/${id}/registro${conflict ? "?conflito=1" : ""}`);
  }
  redirect(agendaHref(first.date, conflict ? "conflito" : "salva"));
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
      localLessonDateTime(new Date(data.starts_at), workspace.time_zone).slice(
        0,
        10,
      ),
      "cancelada",
    ),
  );
}

export async function deleteLesson(id: string, _: string): Promise<string> {
  const lessonId = z.uuid().safeParse(id);
  if (!lessonId.success) return "Aula inválida.";
  const workspace = await requireTeacherWorkspace();

  const client = await createClient();
  const { data: startsAt, error } = await client.rpc("delete_lesson", {
    target_workspace_id: workspace.workspace_id,
    target_lesson_id: lessonId.data,
  });

  if (error) return "Não foi possível excluir a aula. Tente novamente.";
  if (!startsAt) return "Esta aula não está mais disponível para exclusão.";

  const date = localLessonDateTime(
    new Date(startsAt),
    workspace.time_zone,
  ).slice(0, 10);
  revalidatePath("/agenda");
  redirect(agendaHref(date, "excluida"));
}
