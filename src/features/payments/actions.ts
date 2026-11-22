"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { paymentMonthSchema, paymentSchema } from "./schema";

function redirectToCharges(
  notice: "registrado" | "estornado",
  month?: string,
): never {
  const query = new URLSearchParams({ aviso: notice });
  const selectedMonth = paymentMonthSchema.safeParse(month);
  if (selectedMonth.success) query.set("mes", selectedMonth.data);
  revalidatePath("/cobrancas");
  return redirect(`/cobrancas?${query}`);
}

export async function recordPayment(
  studentId: string,
  month: string | undefined,
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
  return redirectToCharges("registrado", month);
}

export async function reversePayment(
  paymentId: string,
  month: string | undefined,
  _: string,
) {
  if (!z.uuid().safeParse(paymentId).success) return "Pagamento inválido.";
  const ws = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client.rpc("reverse_payment", {
    target_workspace_id: ws.workspace_id,
    target_payment_id: paymentId,
  });
  if (error || !data)
    return "Não foi possível estornar este pagamento. Atualize a página e confira o histórico.";
  return redirectToCharges("estornado", month);
}
