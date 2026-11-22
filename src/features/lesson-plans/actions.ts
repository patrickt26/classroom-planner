"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { type LessonPlanState, lessonPlanSchema } from "./schema";

export async function saveLessonPlan(
  lessonId: string,
  editing: boolean,
  previous: LessonPlanState,
  form: FormData,
): Promise<LessonPlanState> {
  const values = {
    objective: String(form.get("objective") ?? ""),
    content: String(form.get("content") ?? ""),
    activities: String(form.get("activities") ?? ""),
    materials: String(form.get("materials") ?? ""),
  };
  const state = { values, attempt: previous.attempt + 1 };
  const id = z.uuid().safeParse(lessonId);
  const parsed = lessonPlanSchema.safeParse(values);
  if (!id.success || !parsed.success)
    return {
      ...state,
      message:
        "Preencha o objetivo e confira o limite de caracteres dos campos.",
    };

  const { workspace_id } = await requireTeacherWorkspace();
  const client = await createClient();
  const plans = client.from("lesson_plans");
  const result = await (editing
    ? plans
        .update(parsed.data)
        .eq("workspace_id", workspace_id)
        .eq("lesson_id", id.data)
    : plans.insert({ ...parsed.data, workspace_id, lesson_id: id.data })
  )
    .select("lesson_id")
    .maybeSingle();

  if (result.error?.code === "23505")
    return {
      ...state,
      message:
        "Esta aula já tem um plano. Reabra o planejamento para editar o plano salvo.",
    };
  if (result.error || !result.data)
    return {
      ...state,
      message:
        "Não foi possível salvar o plano. Confira se a aula ainda está na agenda.",
    };

  redirect(`/agenda/${id.data}/planejamento?salvo=1`);
}
