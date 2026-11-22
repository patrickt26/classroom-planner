"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { type LessonNoteState, lessonNoteSchema } from "./schema";

export async function saveLessonNote(
  lessonId: string,
  previousNoteId: number | null,
  previous: LessonNoteState,
  form: FormData,
): Promise<LessonNoteState> {
  const fields = {
    worked_on: form.get("worked_on"),
    difficulties: form.get("difficulties") ?? "",
    next_steps: form.get("next_steps") ?? "",
  };
  const values = {
    worked_on: typeof fields.worked_on === "string" ? fields.worked_on : "",
    difficulties:
      typeof fields.difficulties === "string" ? fields.difficulties : "",
    next_steps: typeof fields.next_steps === "string" ? fields.next_steps : "",
  };
  const state = { values, attempt: previous.attempt + 1 };
  const parsed = lessonNoteSchema.safeParse(fields);
  if (!parsed.success)
    return {
      ...state,
      message:
        "Preencha o que foi trabalhado e confira o limite de 4.000 caracteres por campo.",
    };

  const id = z.uuid().safeParse(lessonId);
  const version = z.int().positive().nullable().safeParse(previousNoteId);
  if (!id.success || !version.success)
    return { ...state, message: "Aula ou versão inválida." };

  const { workspace_id } = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client.rpc("save_lesson_note", {
    target_workspace_id: workspace_id,
    target_lesson_id: id.data,
    note_worked_on: parsed.data.worked_on,
    note_difficulties: parsed.data.difficulties,
    note_next_steps: parsed.data.next_steps,
    previous_note_id: version.data ?? undefined,
  });

  if (error?.code === "23505")
    return {
      ...state,
      message:
        "Uma versão mais recente já foi salva. Copie seu texto, volte ao registro e edite a versão atual.",
    };
  if (error || !data)
    return {
      ...state,
      message:
        "Não foi possível salvar o registro. Confira se a aula ainda está disponível.",
    };

  revalidatePath("/agenda");
  redirect(`/agenda/${id.data}/registro?salvo=1`);
}
