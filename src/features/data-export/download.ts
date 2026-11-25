type ExportAccount = {
  email: string | null;
  terms_accepted_at: string;
};

export function createDataDownload(
  account: ExportAccount,
  tables: Record<string, unknown[]>,
  generatedAt = new Date(),
) {
  const timestamp = generatedAt.toISOString();
  const body = JSON.stringify(
    {
      format_version: 1,
      generated_at: timestamp,
      account,
      ...tables,
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="classroom-planner-dados-${timestamp.slice(0, 10)}.json"`,
    },
  });
}
