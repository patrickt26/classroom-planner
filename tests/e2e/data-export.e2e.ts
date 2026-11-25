import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "playwright/test";
import { login } from "./login";

type ExportRow = { workspace_id: string };
type ExportedData = {
  format_version: number;
  generated_at: string;
  account: { email: string; terms_accepted_at: string };
  students: (ExportRow & { name: string; notes: string | null })[];
};

async function downloadExport(page: Page, email: string) {
  await login(page, email, "senha-de-teste");
  await page.goto("/configuracoes");
  const downloadLink = page.getByRole("link", { name: "Baixar meus dados" });
  await expect(downloadLink).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadLink.click(),
  ]);
  const { format_version, generated_at, account, ...tables } = JSON.parse(
    await readFile(await download.path(), "utf8"),
  ) as ExportedData & Record<string, ExportRow[]>;

  expect(format_version).toBe(1);
  expect(new Date(generated_at).toISOString()).toBe(generated_at);
  expect(download.suggestedFilename()).toBe(
    `classroom-planner-dados-${generated_at.slice(0, 10)}.json`,
  );
  expect(account.email).toBe(email);
  expect(Number.isFinite(Date.parse(account.terms_accepted_at))).toBe(true);
  expect(Object.keys(tables).sort()).toEqual([
    "charges",
    "grades",
    "guardians",
    "lesson_notes",
    "lesson_plans",
    "lessons",
    "payments",
    "recurrences",
    "student_guardians",
    "student_rate_history",
    "student_subjects",
    "students",
    "subjects",
  ]);
  const [student] = tables.students;
  expect(student).toBeDefined();
  const workspaceIds = new Set(
    Object.values(tables).flatMap((rows) =>
      rows.map((row) => row.workspace_id),
    ),
  );
  expect(workspaceIds).toEqual(new Set([student.workspace_id]));
  return { workspaceId: student.workspace_id, students: tables.students };
}

test("cada professora baixa apenas os dados de seu espaço", async ({
  page,
  browser,
}) => {
  const secondContext = await browser.newContext();
  try {
    const secondPage = await secondContext.newPage();
    const first = await downloadExport(page, "professora.exemplo@example.test");
    const second = await downloadExport(
      secondPage,
      "professora.exportacao@example.test",
    );
    expect(first.workspaceId).not.toBe(second.workspaceId);
    expect(first.students.map((student) => student.name)).toContain("Aluno A");
    expect(first.students.map((student) => student.name)).not.toContain(
      "Aluno do segundo espaço",
    );
    expect(second.students).toMatchObject([
      {
        name: "Aluno do segundo espaço",
        notes: "Observação fictícia do segundo espaço.",
      },
    ]);
  } finally {
    await secondContext.close();
  }
});

test("visitantes não podem baixar os dados", async ({ request }) => {
  const response = await request.get("/configuracoes/dados", {
    maxRedirects: 0,
  });
  expect(response.headers()["content-disposition"]).toBeUndefined();
  if (response.status() !== 401) {
    expect([302, 303, 307, 308]).toContain(response.status());
    const loginUrl = new URL(response.headers().location, response.url());
    expect(loginUrl.pathname).toBe("/entrar");
  }
});
