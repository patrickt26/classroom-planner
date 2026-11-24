"use server";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";
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
      z.object({
        intent: z.enum(["archive", "unarchive", "delete"]),
        id: z.uuid(),
      }),
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
    changes: { name: string } | { archived_at: string | null },
  ) =>
    items
      .update(changes)
      .eq("workspace_id", workspace_id)
      .eq("id", id)
      .select("id")
      .maybeSingle();

  let result: PostgrestSingleResponse<{ id: string } | string | null>;
  switch (change.data.intent) {
    case "save":
      result = parsed.data.id
        ? await update(parsed.data.id, { name: change.data.name })
        : await items
            .insert({ workspace_id, name: change.data.name })
            .select("id")
            .single();
      break;
    case "archive":
    case "unarchive":
      result = await update(change.data.id, {
        archived_at:
          change.data.intent === "archive" ? new Date().toISOString() : null,
      });
      break;
    case "delete":
      result = await client.rpc("delete_catalog_item", {
        target_workspace_id: workspace_id,
        catalog_table: parsed.data.table,
        item_id: change.data.id,
      });
      if (result.error?.code === "23503") {
        revalidatePath("/configuracoes");
        return { variant: "error", message: result.error.message };
      }
      break;
  }
  const { data, error } = result;

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
    message: {
      archive: "Item arquivado.",
      unarchive: "Item desarquivado.",
      save: "Nome salvo.",
      delete: "Item excluído.",
    }[change.data.intent],
  };
}
