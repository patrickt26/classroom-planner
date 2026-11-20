"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { type GuardianFormState, guardianFormSchema } from "./schema";

const guardianTarget = z.object({
  studentId: z.uuid(),
  guardianId: z.uuid(),
});

function readText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveGuardian(
  studentId: string,
  guardianId: string | null,
  previous: GuardianFormState,
  form: FormData,
): Promise<GuardianFormState> {
  const values = {
    name: readText(form, "name"),
    relationship: readText(form, "relationship"),
    phone: readText(form, "phone"),
    financial: form.get("financial") === "on",
  };
  const state = { values, attempt: previous.attempt + 1 };
  const input = guardianFormSchema.safeParse(values);
  if (!input.success) {
    return { ...state, errors: z.flattenError(input.error).fieldErrors };
  }
  const target = guardianTarget
    .extend({ guardianId: z.uuid().nullable() })
    .safeParse({ studentId, guardianId });
  if (!target.success) return { ...state, message: "Cadastro inválido." };

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client.rpc("save_student_guardian", {
    target_workspace_id: workspace.workspace_id,
    target_student_id: target.data.studentId,
    target_guardian_id: target.data.guardianId ?? undefined,
    guardian_name: input.data.name,
    guardian_relationship: input.data.relationship,
    guardian_phone: input.data.phone ?? undefined,
    financial_guardian: input.data.financial,
  });

  if (error || !data) {
    return {
      ...state,
      message: "Não foi possível salvar o responsável. Tente novamente.",
    };
  }
  redirect(
    `/alunos/${target.data.studentId}?aviso=${guardianId ? "salvo" : "cadastrado"}#responsaveis`,
  );
}

export async function removeGuardian(
  studentId: string,
  guardianId: string,
  _: string,
): Promise<string> {
  const target = guardianTarget.safeParse({ studentId, guardianId });
  if (!target.success) return "Cadastro inválido.";

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client.rpc("remove_student_guardian", {
    target_workspace_id: workspace.workspace_id,
    target_student_id: target.data.studentId,
    target_guardian_id: target.data.guardianId,
  });

  if (error || !data)
    return "Não foi possível remover o responsável. Tente novamente.";
  redirect(`/alunos/${target.data.studentId}?aviso=removido#responsaveis`);
}
