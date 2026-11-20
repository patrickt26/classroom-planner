"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormFeedback } from "@/features/auth/components/account-form";
import { createClient } from "@/lib/supabase/server";
import { requireTeacherWorkspace } from "./queries";

const workspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  brand: z.string().trim().max(100),
});
export async function saveWorkspace(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const input = workspaceSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return {
      variant: "error",
      message: "Preencha o nome e use até 100 caracteres por campo.",
    };
  const workspace = await requireTeacherWorkspace();
  const client = await createClient();
  const { error } = await client
    .from("workspaces")
    .update(input.data)
    .eq("workspace_id", workspace.workspace_id)
    .select("workspace_id")
    .single();
  if (error)
    return {
      variant: "error",
      message: "Não foi possível salvar as alterações.",
    };
  revalidatePath("/(professora)", "layout");
  return { variant: "success", message: "Alterações salvas." };
}
