import { localLessonDateTime } from "@/features/lessons/calendar";
import { createClient } from "@/lib/supabase/server";

export type PendingCharge = {
  lessonId: string;
  lessonDate: string;
  time: string;
  subject: string;
  amount: number;
};

export async function getPendingChargeTotal(workspaceId: string) {
  const client = await createClient();
  let total = 0;
  let cursor: string | undefined;
  const pageSize = 200;
  for (;;) {
    const query = client
      .from("charges")
      .select("lesson_id, amount_cents")
      .eq("workspace_id", workspaceId)
      .is("payment_id", null)
      .order("lesson_id")
      .limit(pageSize);
    const { data, error } = await (cursor
      ? query.gt("lesson_id", cursor)
      : query);
    if (error) throw new Error("Não foi possível carregar o total a receber.");
    for (const charge of data) total += charge.amount_cents;
    if (data.length < pageSize) return total;
    cursor = data[data.length - 1].lesson_id;
  }
}

export async function getPendingCharges(
  workspaceId: string,
  timeZone: string,
  studentId?: string,
) {
  const client = await createClient();
  const groups = new Map<
    string,
    { id: string; name: string; anonymized: boolean; charges: PendingCharge[] }
  >();
  let cursor: string | undefined;
  for (;;) {
    const query = client
      .from("charges")
      .select(
        "lesson_id, student_id, amount_cents, lessons!inner(starts_at, subjects!lessons_workspace_id_subject_id_fkey(name), students!lessons_workspace_id_student_id_fkey(name, anonymized_at))",
      )
      .eq("workspace_id", workspaceId)
      .is("payment_id", null)
      .order("lesson_id")
      .limit(200);
    if (studentId) query.eq("student_id", studentId);
    const { data, error } = await (cursor
      ? query.gt("lesson_id", cursor)
      : query);
    if (error)
      throw new Error("Não foi possível carregar as cobranças pendentes.");
    for (const row of data) {
      const group = groups.get(row.student_id) ?? {
        id: row.student_id,
        name: row.lessons.students.name,
        anonymized: row.lessons.students.anonymized_at !== null,
        charges: [],
      };
      const local = localLessonDateTime(
        new Date(row.lessons.starts_at),
        timeZone,
      );
      group.charges.push({
        lessonId: row.lesson_id,
        lessonDate: local.slice(0, 10),
        time: local.slice(11, 16),
        subject: row.lessons.subjects.name,
        amount: row.amount_cents,
      });
      groups.set(row.student_id, group);
    }
    if (data.length < 200) break;
    cursor = data[data.length - 1].lesson_id;
  }
  for (const group of groups.values()) {
    group.charges.sort(
      (a, b) =>
        a.lessonDate.localeCompare(b.lessonDate) ||
        a.time.localeCompare(b.time),
    );
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}
