import { expect, test } from "vitest";
import { createDataDownload } from "./download";

test("monta o arquivo JSON versionado com os dados da conta e as tabelas", async () => {
  const generatedAt = new Date("2026-11-25T12:34:56.000Z");
  const account = {
    email: "professora@example.test",
    terms_accepted_at: "2026-11-24T12:00:00Z",
  };
  const tables = {
    students: [{ name: "Aluno A", notes: "Revisão de frações" }],
    guardians: [],
  };
  const response = createDataDownload(account, tables, generatedAt);

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe(
    "application/json; charset=utf-8",
  );
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Content-Disposition")).toBe(
    'attachment; filename="classroom-planner-dados-2026-11-25.json"',
  );
  expect(await response.json()).toEqual({
    format_version: 1,
    generated_at: generatedAt.toISOString(),
    account,
    ...tables,
  });
});
