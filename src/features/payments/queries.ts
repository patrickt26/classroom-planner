import { createClient } from "@/lib/supabase/server";

export async function getPaymentHistory(workspaceId: string) {
  const client = await createClient();
  const payments = [];
  let cursor: string | undefined;
  for (;;) {
    const query = client
      .from("payments")
      .select(
        "id, paid_on, amount_cents, method, note, reversed_at, students(name)",
      )
      .eq("workspace_id", workspaceId)
      .order("id")
      .limit(200);
    const { data, error } = await (cursor ? query.gt("id", cursor) : query);
    if (error)
      throw new Error("Não foi possível carregar o histórico de pagamentos.");
    payments.push(...data);
    if (data.length < 200) break;
    cursor = data[data.length - 1].id;
  }
  return payments.sort((a, b) => b.paid_on.localeCompare(a.paid_on));
}
