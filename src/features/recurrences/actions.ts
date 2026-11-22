"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { agendaDateSchema } from "@/features/lessons/agenda-schema";
import {
  agendaHref,
  lessonStartInstant,
  localLessonDateTime,
} from "@/features/lessons/calendar";
import { recurrenceSettingsSchema } from "@/features/lessons/schema";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function saveRecurrence(id: string, _: string, form: FormData) {
  const values = Object.fromEntries(form);
  const parsed = recurrenceSettingsSchema.safeParse({
    ...values,
    day_of_week: z
      .string()
      .regex(/^[0-6]$/)
      .safeParse(values.day_of_week).success
      ? Number(values.day_of_week)
      : null,
    duration_minutes: Number(values.duration_minutes),
    end_date: values.end_date || null,
    meeting_url:
      values.modality === "online" ? values.meeting_url || null : null,
  });
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return "Confira os dados da série, a data final e o link do Meet.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const today = localLessonDateTime(new Date(), ws.time_zone).slice(0, 10);
  const { data, error } = await client
    .from("recurrences")
    .update(parsed.data)
    .eq("workspace_id", ws.workspace_id)
    .eq("id", id)
    .is("ended_at", null)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .select("student_id")
    .maybeSingle();
  if (error || !data)
    return "Não foi possível salvar a série. Confira a data final.";
  revalidatePath(`/alunos/${data.student_id}`);
  revalidatePath("/agenda", "layout");
  redirect(agendaHref(today, "serie-salva"));
}

export async function endRecurrence(id: string, _: string) {
  if (!z.uuid().safeParse(id).success) return "Série inválida.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("recurrences")
    .update({ ended_at: new Date().toISOString() })
    .eq("workspace_id", ws.workspace_id)
    .eq("id", id)
    .is("ended_at", null)
    .select("student_id")
    .maybeSingle();
  if (error || !data) return "Não foi possível encerrar a série.";
  revalidatePath(`/alunos/${data.student_id}`);
  revalidatePath("/agenda", "layout");
  redirect(
    agendaHref(
      localLessonDateTime(new Date(), ws.time_zone).slice(0, 10),
      "serie-encerrada",
    ),
  );
}

export async function changeOccurrence(id: string, _: string, form: FormData) {
  const status = z
    .enum([
      "confirmada",
      "realizada",
      "falta",
      "cancelada",
      "reposicao_pendente",
    ])
    .safeParse(form.get("status"));
  if (!z.uuid().safeParse(id).success || !status.success)
    return "Situação inválida.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("lessons")
    .update({ status: status.data })
    .eq("workspace_id", ws.workspace_id)
    .eq("id", id)
    .in(
      "status",
      status.data === "reposicao_pendente"
        ? ["cancelada", "falta"]
        : ["agendada", "confirmada"],
    )
    .select("id")
    .maybeSingle();
  if (error || !data) return "Não foi possível alterar a situação da aula.";
  revalidatePath("/agenda", "layout");
  if (status.data === "realizada") redirect(`/agenda/${data.id}/registro`);
  return "";
}

export async function scheduleMakeup(id: string, _: string, form: FormData) {
  const parsed = z
    .object({ date: agendaDateSchema, time: z.iso.time() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success || !z.uuid().safeParse(id).success)
    return "Confira a data e o horário.";
  const ws = await requireTeacherWorkspace();
  const start = lessonStartInstant(
    parsed.data.date,
    parsed.data.time,
    ws.time_zone,
  );
  if (!start) return "Esse horário não existe no fuso do espaço.";
  const client = await createClient();
  const unavailableMessage =
    "Não foi possível agendar a reposição. Atualize a agenda.";
  const earlierStartMessage =
    "Escolha uma data e um horário iguais ou posteriores aos da aula original.";
  const { data: original, error: originalError } = await client
    .from("lessons")
    .select("starts_at")
    .eq("workspace_id", ws.workspace_id)
    .eq("id", id)
    .eq("status", "reposicao_pendente")
    .maybeSingle();
  if (originalError || !original) return unavailableMessage;
  if (start.getTime() < Date.parse(original.starts_at))
    return earlierStartMessage;

  const { data, error } = await client.rpc("schedule_makeup", {
    target_workspace_id: ws.workspace_id,
    original_id: id,
    new_start: start.toISOString(),
  });
  if (error?.code === "22023" && error.message === "makeup_before_original")
    return earlierStartMessage;
  if (error || !data) return unavailableMessage;
  revalidatePath("/agenda");
  redirect(agendaHref(parsed.data.date, "reposicao"));
}
