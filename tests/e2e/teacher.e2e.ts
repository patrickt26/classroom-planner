import { randomUUID } from "node:crypto";
import { expect, test } from "playwright/test";
import { login } from "./login";

test("professora abre o plano de uma aula da Hoje, salva e volta", async ({
  page,
}) => {
  await login(page, "professora.exemplo@example.test", "senha-de-teste");
  const plan = page.getByRole("link", {
    name: "Ver plano da aula de Aluno C às 09:30",
    exact: true,
  });
  await plan.click();
  await expect(page).toHaveURL(/\/agenda\/[^/]+\/planejamento\?origem=hoje$/);
  await expect(
    page.getByRole("heading", { name: "Planejamento da aula" }),
  ).toBeVisible();
  const back = page.getByRole("link", { name: "Voltar para Hoje" });
  await expect(back).toHaveAttribute("href", "/");

  await page.getByLabel("Objetivo").fill("Comparar frações com apoio visual.");
  await page.getByRole("button", { name: "Salvar plano" }).click();
  await expect(page.getByText("Plano salvo.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/planejamento\?salvo=1&origem=hoje$/);
  await back.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(plan).toBeVisible();
});

test("professora cadastra um aluno, realiza uma aula e recebe o pagamento", async ({
  page,
}) => {
  const student = `Aluno E2E ${randomUUID().slice(0, 8)}`;
  const lesson = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: student, exact: true }),
  });
  await test.step("Entrar com a professora do seed", async () => {
    await login(page, "professora.exemplo@example.test", "senha-de-teste");
  });

  await test.step("Cadastrar aluno com responsável e valor por hora", async () => {
    await page.goto("/alunos");
    await page.getByRole("link", { name: "Cadastrar aluno" }).click();
    await page.getByLabel("Nome do aluno").fill(student);
    await page.getByLabel("Valor por hora (R$)").fill("80,00");
    await page.getByLabel("Nome do responsável").fill("Responsável de exemplo");
    await page.getByLabel("Parentesco ou vínculo").fill("Mãe");
    await page.getByRole("button", { name: "Salvar aluno" }).click();
    await expect(
      page.getByText("Aluno cadastrado.", { exact: true }),
    ).toBeVisible();
  });

  await test.step("Agendar aula de Matemática", async () => {
    await page.goto("/agenda");
    await page.getByRole("link", { name: "Nova aula" }).click();
    await page
      .getByLabel("Aluno", { exact: true })
      .selectOption({ label: student });
    await page.getByLabel("Disciplina").selectOption({ label: "Matemática" });
    await page.getByLabel("Horário de início").fill("07:00");
    await page
      .getByRole("button", { name: "Salvar aula", exact: true })
      .click();
    const confirmConflict = page.getByRole("button", {
      name: "Salvar mesmo assim",
    });
    await expect(lesson.or(confirmConflict)).toBeVisible();
    if (await confirmConflict.isVisible()) await confirmConflict.click();
    await expect(lesson.getByText("Agendada", { exact: true })).toBeVisible();
  });

  await test.step("Marcar realizada e conferir o registro salvo", async () => {
    await lesson.getByRole("link", { name: /Marcar realizada/ }).click();
    const workedOn = "Adição de frações com o mesmo denominador.";
    await page.getByLabel("O que foi trabalhado").fill(workedOn);
    await page
      .getByRole("button", { name: "Marcar realizada e salvar" })
      .click();
    await expect(page.getByText(workedOn, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Voltar para a agenda" }).click();
    await expect(lesson.getByText("Realizada", { exact: true })).toBeVisible();
  });

  await test.step("Quitar a cobrança gerada e conferir o histórico", async () => {
    await page.goto("/cobrancas");
    const account = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: student, exact: true }),
    });
    await account.getByRole("button", { name: "Registrar pagamento" }).click();
    const dialog = page.getByRole("dialog", { name: "Registrar pagamento" });
    await dialog.getByRole("checkbox", { name: /Matemática/ }).check();
    await dialog
      .getByLabel("Forma de pagamento")
      .selectOption({ label: "Pix" });
    await dialog.getByRole("button", { name: "Confirmar pagamento" }).click();
    await expect(
      page.getByText("Pagamento registrado.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(account).toHaveCount(1);
    await expect(account).toContainText("Pix");
    await expect(account).toContainText("R$ 80,00");
    await expect(
      account.getByRole("button", { name: "Registrar pagamento" }),
    ).toHaveCount(0);
  });
});
