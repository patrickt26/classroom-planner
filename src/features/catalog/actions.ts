"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormFeedback } from "@/components/ui/alert";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import { catalogNameSchema, catalogTableSchema } from "./schema";

export async function saveCatalogItem(
  table: string,
  id: string | null,
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const parsed = z
    .object({
      table: catalogTableSchema,
      id: z.uuid().nullable(),
    })
    .safeParse({ table, id });
  if (!parsed.success) return { variant: "error", message: "Item inválido." };

  const change = z
    .discriminatedUnion("intent", [
      z.object({ intent: z.literal("save"), name: catalogNameSchema }),
      z.object({ intent: z.literal("archive"), id: z.uuid() }),
    ])
    .safeParse({
      intent: form.get("intent") ?? "save",
      name: form.get("name"),
      id: parsed.data.id,
    });
  if (!change.success)
    return {
      variant: "error",
      message: "Confira a ação e o nome, que deve ter até 100 caracteres.",
    };

  const { workspace_id } = await requireTeacherWorkspace();
  const client = await createClient();
  const items = client.from(parsed.data.table);
  const update = (
    id: string,
    changes: { name: string } | { archived_at: string },
  ) =>
    items
      .update(changes)
      .eq("workspace_id", workspace_id)
      .eq("id", id)
      .select("id")
      .maybeSingle();

  const { data, error } =
    change.data.intent === "archive"
      ? await update(change.data.id, { archived_at: new Date().toISOString() })
      : parsed.data.id
        ? await update(parsed.data.id, { name: change.data.name })
        : await items
            .insert({ workspace_id, name: change.data.name })
            .select("id")
            .single();

  if (error?.code === "23505")
    return {
      variant: "error",
      message: "Já existe um item com esse nome neste espaço.",
    };
  if (error || !data)
    return {
      variant: "error",
      message: "Não foi possível salvar a alteração.",
    };

  revalidatePath("/", "layout");
  return {
    variant: "success",
    message:
      change.data.intent === "archive" ? "Item arquivado." : "Nome salvo.",
  };
}
