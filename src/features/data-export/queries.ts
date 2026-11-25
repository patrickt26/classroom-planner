import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ExportTable = keyof Database["public"]["Tables"];

const tables = {
  students: {
    columns:
      "workspace_id,id,name,birth_date,school,grade_id,notes,hourly_rate,is_free,guardian_consent_at,archived_at,created_at,updated_at",
    order: ["id"],
  },
  guardians: {
    columns: "workspace_id,id,name,phone,created_at,updated_at",
    order: ["id"],
  },
  student_guardians: {
    columns:
      "workspace_id,student_id,guardian_id,relationship,is_financial_guardian,created_at,updated_at",
    order: ["student_id", "guardian_id"],
  },
  subjects: {
    columns: "workspace_id,id,name,archived_at,created_at,updated_at",
    order: ["id"],
  },
  student_subjects: {
    columns: "workspace_id,student_id,subject_id,created_at,updated_at",
    order: ["student_id", "subject_id"],
  },
  grades: {
    columns: "workspace_id,id,name,archived_at,created_at,updated_at",
    order: ["id"],
  },
  lessons: {
    columns:
      "workspace_id,id,student_id,subject_id,recurrence_id,rescheduled_from_id,starts_at,duration_minutes,modality,meeting_url,status,pending_reason,created_at,updated_at",
    order: ["id"],
  },
  recurrences: {
    columns:
      "workspace_id,id,student_id,subject_id,day_of_week,start_time,duration_minutes,modality,meeting_url,start_date,end_date,ended_at,created_at,updated_at",
    order: ["id"],
  },
  lesson_plans: {
    columns:
      "workspace_id,lesson_id,objective,content,activities,materials,created_at,updated_at",
    order: ["lesson_id"],
  },
  lesson_notes: {
    columns:
      "workspace_id,id,lesson_id,worked_on,difficulties,next_steps,supersedes_id,created_at",
    order: ["id"],
  },
  charges: {
    columns:
      "workspace_id,lesson_id,student_id,payment_id,duration_minutes,hourly_rate,amount_cents",
    order: ["lesson_id"],
  },
  payments: {
    columns:
      "workspace_id,id,student_id,amount_cents,method,note,paid_on,reversed_at",
    order: ["id"],
  },
  student_rate_history: {
    columns: "workspace_id,student_id,changed_on,previous_hourly_rate",
    order: ["student_id", "changed_on"],
  },
} satisfies Partial<
  Record<ExportTable, { columns: string; order: readonly string[] }>
>;

type WorkspaceExportTable = keyof typeof tables;
type ServerClient = Awaited<ReturnType<typeof createClient>>;

const pageSize = 500;

async function readTable(
  client: ServerClient,
  workspaceId: string,
  table: WorkspaceExportTable,
) {
  const { columns, order } = tables[table];
  const rows: unknown[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const query = client
      .from(table)
      .select(columns)
      .eq("workspace_id", workspaceId);
    for (const column of order) query.order(column);

    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Não foi possível exportar ${table}.`);
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

export async function loadWorkspaceExport(
  client: ServerClient,
  workspaceId: string,
) {
  const names = Object.keys(tables) as WorkspaceExportTable[];
  const entries = await Promise.all(
    names.map(
      async (table) =>
        [table, await readTable(client, workspaceId, table)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
