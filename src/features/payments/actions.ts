"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "./schema";

export async function recordPayment(
  studentId: string,
  _: string,
  form: FormData,
) {
  const parsed = paymentSchema.safeParse({
    studentId,
    lessonIds: form.getAll("lessonId"),
    paidOn: form.get("paidOn"),
    method: form.get("method"),
    note: form.get("note"),
  });
  if (!parsed.success)
    return "Confira as aulas selecionadas e os dados do pagamento.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { lessonIds, paidOn, method, note } = parsed.data;
  const { error } = await client.rpc("record_payment", {
    target_workspace_id: ws.workspace_id,
    target_student_id: parsed.data.studentId,
    lesson_ids: lessonIds,
    payment_date: paidOn,
    payment_method: method,
    payment_note: note,
  });
  if (error?.code === "22007")
    return "Escolha uma data entre a última aula selecionada e hoje.";
  if (error?.code === "P0001")
    return "As cobranças pendentes mudaram. Atualize a página e confira a seleção.";
  if (error) return "Não foi possível registrar o pagamento. Tente novamente.";
  revalidatePath("/cobrancas");
  redirect("/cobrancas?aviso=registrado");
}

export async function reversePayment(paymentId: string, _: string) {
  if (!z.uuid().safeParse(paymentId).success) return "Pagamento inválido.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client.rpc("reverse_payment", {
    target_workspace_id: ws.workspace_id,
    target_payment_id: paymentId,
  });
  if (error || !data)
    return "Não foi possível estornar este pagamento. Atualize a página e confira o histórico.";
  revalidatePath("/cobrancas");
  redirect("/cobrancas?aviso=estornado");
}
