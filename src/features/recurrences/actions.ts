"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { agendaDateSchema } from "@/features/lessons/agenda-schema";
import { agendaHref, lessonStartInstant } from "@/features/lessons/calendar";
import { recurrenceSchema } from "@/features/lessons/schema";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function saveRecurrence(
  id: string | null,
  _: string,
  form: FormData,
) {
  const values = Object.fromEntries(form);
  const parsed = recurrenceSchema.safeParse({
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
  if (!z.uuid().nullable().safeParse(id).success || !parsed.success)
    return "Confira os dados da recorrência, o intervalo de datas e o link do Meet.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const table = client.from("recurrences");
  const query = id
    ? table
        .update(parsed.data)
        .eq("workspace_id", ws.workspace_id)
        .eq("id", id)
        .eq("student_id", parsed.data.student_id)
        .is("ended_at", null)
    : table.insert({ ...parsed.data, workspace_id: ws.workspace_id });
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) return "Não foi possível salvar a recorrência.";
  revalidatePath("/agenda", "layout");
  redirect("/agenda/recorrencias?aviso=salva");
}

export async function endRecurrence(id: string, _: string) {
  if (!z.uuid().safeParse(id).success) return "Recorrência inválida.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from("recurrences")
    .update({ ended_at: new Date().toISOString() })
    .eq("workspace_id", ws.workspace_id)
    .eq("id", id)
    .is("ended_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return "Não foi possível encerrar a recorrência.";
  revalidatePath("/agenda", "layout");
  redirect("/agenda/recorrencias?aviso=encerrada");
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
  revalidatePath("/agenda");
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
  const { data, error } = await client.rpc("schedule_makeup", {
    target_workspace_id: ws.workspace_id,
    original_id: id,
    new_start: start.toISOString(),
  });
  if (error || !data)
    return "Não foi possível agendar a reposição. Atualize a agenda.";
  revalidatePath("/agenda");
  redirect(agendaHref(parsed.data.date, "reposicao"));
}
