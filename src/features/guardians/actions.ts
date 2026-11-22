"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { searchAvailableGuardians } from "./queries";
import {
  type GuardianFormState,
  type GuardianLinkState,
  guardianFormSchema,
  guardianLinkSchema,
} from "./schema";

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

  if (
    error?.code === "23514" &&
    error.message === "student_guardian_required"
  ) {
    return "Vincule outro responsável antes de remover o único responsável do aluno.";
  }
  if (error || !data)
    return "Não foi possível remover o responsável. Tente novamente.";
  redirect(`/alunos/${target.data.studentId}?aviso=removido#responsaveis`);
}

export async function linkGuardian(
  studentId: string,
  guardianId: string,
  previous: GuardianLinkState,
  form: FormData,
): Promise<GuardianLinkState> {
  const values = {
    relationship: readText(form, "relationship"),
    financial: form.get("financial") === "on",
  };
  const state = { values, attempt: previous.attempt + 1 };
  const input = guardianLinkSchema.safeParse(values);
  if (!input.success) {
    return { ...state, errors: z.flattenError(input.error).fieldErrors };
  }
  const target = guardianTarget.safeParse({ studentId, guardianId });
  if (!target.success) return { ...state, message: "Vínculo inválido." };

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client.rpc("link_existing_student_guardian", {
    target_workspace_id: workspace.workspace_id,
    target_student_id: target.data.studentId,
    target_guardian_id: target.data.guardianId,
    guardian_relationship: input.data.relationship,
    financial_guardian: input.data.financial,
  });

  if (error || !data) {
    return {
      ...state,
      message: error
        ? "Não foi possível vincular o responsável. Tente novamente."
        : "Este responsável não está mais disponível para vínculo.",
    };
  }
  redirect(`/alunos/${target.data.studentId}?aviso=vinculado#responsaveis`);
}

export async function searchGuardiansForRegistration(
  search: string,
  page: number,
) {
  const input = z
    .object({
      search: z.string().trim().min(1).max(120),
      page: z.int().min(1).max(999999),
    })
    .safeParse({ search, page });
  if (!input.success) return null;
  const results = await searchAvailableGuardians(
    null,
    input.data.search,
    input.data.page,
  );
  return {
    guardians: results.guardians.map(({ id, name, phone }) => ({
      id,
      name,
      phone,
    })),
    hasNext: results.hasNext,
  };
}
