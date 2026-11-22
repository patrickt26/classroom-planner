"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  guardianFormSchema,
  guardianLinkSchema,
} from "@/features/guardians/schema";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import type { StudentFormState, StudentFormValues } from "./form-state";
import { studentFormSchema } from "./schema";

const registrationGuardianSchema = z.discriminatedUnion("mode", [
  guardianLinkSchema.extend({
    mode: z.literal("existing"),
    id: z.uuid("Selecione um responsável na busca."),
  }),
  guardianFormSchema.extend({ mode: z.literal("new") }),
]);

function readText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveStudent(
  id: string | null,
  archived: boolean,
  previous: StudentFormState,
  form: FormData,
): Promise<StudentFormState> {
  const values: StudentFormValues = {
    name: readText(form, "name"),
    birth_date: readText(form, "birth_date"),
    grade_id: readText(form, "grade_id"),
    school: readText(form, "school"),
    hourly_rate: readText(form, "hourly_rate"),
    is_free: form.get("is_free") === "on",
    notes: readText(form, "notes"),
    subject_ids: form
      .getAll("subject_ids")
      .map((value) => (typeof value === "string" ? value : "")),
  };
  const studentId = z.uuid().nullable().safeParse(id);
  const attempt = previous.attempt + 1;
  const state: StudentFormState = { values, attempt };
  if (!studentId.success) return { ...state, message: "Cadastro inválido." };

  const input = studentFormSchema.safeParse(values);
  if (!input.success) state.errors = z.flattenError(input.error).fieldErrors;

  let guardian: z.output<typeof registrationGuardianSchema> | undefined;
  if (!studentId.data) {
    const guardianValues = {
      name: readText(form, "guardian_name"),
      phone: readText(form, "guardian_phone"),
      relationship: readText(form, "guardian_relationship"),
      financial: form.get("guardian_financial") === "on",
    };
    state.guardian = { values: guardianValues, attempt };
    const guardianInput = registrationGuardianSchema.safeParse({
      ...guardianValues,
      mode: form.get("guardian_mode"),
      id: form.get("guardian_id"),
    });
    if (!guardianInput.success) {
      const errors = z.flattenError(guardianInput.error).fieldErrors;
      state.guardian.errors = errors;
      const selectionError = guardianInput.error.issues.find(
        ({ path }) => path[0] === "id",
      );
      state.guardian.message = errors.mode
        ? "Escolha como informar o responsável."
        : (selectionError?.message ?? "Confira os dados do responsável.");
      return state;
    }
    guardian = guardianInput.data;
  }

  if (!input.success) return state;

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { student, subject_ids } = input.data;
  const { data, error } = await client.rpc("save_student", {
    target_workspace_id: workspace.workspace_id,
    target_student_id: studentId.data ?? undefined,
    student_name: student.name,
    student_birth_date: student.birth_date ?? undefined,
    student_grade_id: student.grade_id ?? undefined,
    student_school: student.school ?? undefined,
    student_hourly_rate: student.hourly_rate,
    student_is_free: student.is_free,
    student_notes: student.notes ?? undefined,
    selected_subject_ids: subject_ids,
    ...(guardian && {
      existing_guardian_id:
        guardian.mode === "existing" ? guardian.id : undefined,
      guardian_name: guardian.mode === "new" ? guardian.name : undefined,
      guardian_phone:
        guardian.mode === "new" ? (guardian.phone ?? undefined) : undefined,
      guardian_relationship: guardian.relationship,
      financial_guardian: guardian.financial,
    }),
  });

  if (state.guardian && error?.message === "student_guardian_unavailable") {
    state.guardian.message =
      "Este responsável não está mais disponível. Selecione outro.";
    return state;
  }
  if (error?.code === "23503") {
    if (error.message.includes("students_workspace_id_grade_id_fkey")) {
      return {
        ...state,
        errors: {
          grade_id: ["Este ano não está mais disponível. Selecione outro."],
        },
      };
    }
    if (
      error.message.includes("student_subjects_workspace_id_subject_id_fkey")
    ) {
      return {
        ...state,
        errors: {
          subject_ids: [
            "Uma das disciplinas não está disponível. Confira a seleção.",
          ],
        },
      };
    }
  }
  if (error || !data)
    return {
      ...state,
      message: "Não foi possível salvar o aluno. Tente novamente.",
    };
  if (!studentId.data) redirect("/alunos?aviso=cadastrado");
  redirect(
    archived
      ? "/alunos?situacao=arquivados&aviso=salvo"
      : "/alunos?aviso=salvo",
  );
}

export async function changeStudentStatus(
  id: string,
  _: string,
  form: FormData,
): Promise<string> {
  const input = z
    .object({
      id: z.uuid(),
      status: z.enum(["arquivar", "reativar"]),
    })
    .safeParse({ id, status: form.get("status") });
  if (!input.success) return "Não foi possível alterar a situação do aluno.";

  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const archive = input.data.status === "arquivar";
  const query = client
    .from("students")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("workspace_id", workspace.workspace_id)
    .eq("id", input.data.id);
  const { error } = await (archive
    ? query.is("archived_at", null)
    : query.not("archived_at", "is", null));
  if (error)
    return "Não foi possível alterar a situação do aluno. Tente novamente.";
  redirect(
    archive
      ? "/alunos?situacao=arquivados&aviso=arquivado"
      : "/alunos?aviso=reativado",
  );
}
