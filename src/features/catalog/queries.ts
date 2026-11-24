import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";
import type { CatalogTable } from "./schema";

export async function listCatalogItems(table: CatalogTable) {
  const { workspace_id } = await requireTeacherWorkspace();
  const client = await createClient();
  const loadError = "Não foi possível carregar as configurações do espaço.";
  if (table === "grades") {
    const { data, error } = await client
      .from("grades")
      .select("id, name, archived_at, students(id)")
      .eq("workspace_id", workspace_id)
      .limit(1, { referencedTable: "students" })
      .order("name");
    if (error) throw new Error(loadError);
    return data.map(({ students, ...item }) => ({
      ...item,
      inUse: students.length > 0,
    }));
  }
  const { data, error } = await client
    .from("subjects")
    .select(
      "id, name, archived_at, student_subjects(student_id), lessons(id), recurrences(id)",
    )
    .eq("workspace_id", workspace_id)
    .limit(1, { referencedTable: "student_subjects" })
    .limit(1, { referencedTable: "lessons" })
    .limit(1, { referencedTable: "recurrences" })
    .order("name");
  if (error) throw new Error(loadError);
  return data.map(({ student_subjects, lessons, recurrences, ...item }) => ({
    ...item,
    inUse:
      student_subjects.length > 0 ||
      lessons.length > 0 ||
      recurrences.length > 0,
  }));
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
