import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import type { CatalogTable } from "./schema";

export async function listCatalogItems(table: CatalogTable) {
  const { workspace_id } = await requireTeacherWorkspace();
  const client = await createClient();
  const { data, error } = await client
    .from(table)
    .select("id, name, archived_at")
    .eq("workspace_id", workspace_id)
    .order("name");
  if (error)
    throw new Error("Não foi possível carregar as configurações do espaço.");
  return data;
}

export async function getCatalogOptions(
  table: CatalogTable,
  currentIds: string[] = [],
) {
  const { workspace_id } = await requireTeacherWorkspace();
  const client = await createClient();
  const query = client
    .from(table)
    .select("id, name, archived_at")
    .eq("workspace_id", workspace_id);
  const { data, error } = await (currentIds.length
    ? query.or(`archived_at.is.null,id.in.(${currentIds.join(",")})`)
    : query.is("archived_at", null)
  ).order("name");
  if (error) throw new Error("Não foi possível carregar as matérias e séries.");
  return data.map(({ id, name, archived_at }) => ({
    id,
    name: archived_at ? `${name} (arquivada)` : name,
  }));
}
