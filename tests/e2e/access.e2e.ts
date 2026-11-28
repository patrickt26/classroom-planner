import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "playwright/test";
import { legalVersion } from "../../src/features/legal/version";
import { login } from "./login";

function localAdmin() {
  const secret = process.env.E2E_SUPABASE_SECRET_KEY;
  if (!secret)
    throw new Error("Exporte a SECRET_KEY local em E2E_SUPABASE_SECRET_KEY.");
  return createClient("http://127.0.0.1:54321", secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test("professora confirma a saída global e revoga outra sessão", async ({
  page,
}) => {
  const email = "professora.sessoes@example.test";
  const password = "senha-de-teste";
  const otherDevice = localAdmin();
  const { data, error } = await otherDevice.auth.signInWithPassword({
    email,
    password,
  });
  expect(error).toBeNull();
  if (!data.session) throw new Error("Falha ao criar a segunda sessão.");

  await login(page, email, password);
  await page.goto("/configuracoes");
  const trigger = page.getByRole("button", {
    name: "Sair de todos os aparelhos",
  });
  const dialog = page.getByRole("dialog", {
    name: "Sair de todos os aparelhos?",
  });
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/configuracoes$/);

  await trigger.click();
  await dialog.getByRole("button", { name: "Confirmar saída" }).click();
  await expect(page).toHaveURL(/\/entrar\?aviso=sessoes-encerradas$/);
  await expect(
    page.getByText("Você saiu de todos os aparelhos."),
  ).toBeVisible();
  await page.goto("/configuracoes");
  await expect(page).toHaveURL(/\/entrar(?:\?.*)?$/);

  // O access token já emitido pode durar até expirar. A renovação deve falhar.
  const renewal = await otherDevice.auth.refreshSession({
    refresh_token: data.session.refresh_token,
  });
  expect(renewal.data.session).toBeNull();
  expect(renewal.error?.status).toBe(400);
});

test("produção fecha o cadastro público e o mostruário", async ({
  page,
  request,
}) => {
  await page.goto("/entrar");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar conta" })).toHaveCount(0);
  for (const path of ["/criar-conta", "/tema", "/tema/alunos"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("professora convidada define a senha pelo e-mail e entra em uma nova sessão", async ({
  page,
  request,
}) => {
  const admin = localAdmin();
  const email = `professora-${randomUUID()}@example.test`;
  const password = `Senha-ficticia-1-${randomUUID()}`;
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  expect(error).toBeNull();

  const mailbox = "http://127.0.0.1:54324/api/v1";
  const search = async () => {
    const response = await request.get(`${mailbox}/search`, {
      params: { query: `to:${email}` },
    });
    expect(response.ok()).toBe(true);
    const { messages } = (await response.json()) as {
      messages: { ID: string }[];
    };
    return messages[0]?.ID;
  };
  await expect.poll(search, { timeout: 15_000 }).toBeTruthy();
  const message = await request.get(`${mailbox}/message/${await search()}`);
  expect(message.ok()).toBe(true);
  const { HTML } = (await message.json()) as { HTML: string };
  await page.setContent(HTML);
  await page
    .getByRole("link", { name: "Aceitar convite e criar senha" })
    .click();
  await expect(page).toHaveURL("http://localhost:3000/nova-senha");
  await page.getByLabel("Nova senha", { exact: false }).fill(password);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/\/aceitar-termos$/);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Hoje", exact: true }),
  ).toBeVisible();
  await page.context().clearCookies();
  await login(page, email, password);
});

test("a API rejeita uma versão antiga e a tela exige o aceite vigente", async ({
  page,
}) => {
  const admin = localAdmin();
  const email = `professora-${randomUUID()}@example.test`;
  const password = `Senha-ficticia-1-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  if (!data.user) throw new Error("Falha ao criar a conta fictícia.");
  const account = localAdmin();
  try {
    expect(
      (await account.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();
    expect(
      (
        await account.from("terms_acceptances").insert({
          user_id: data.user.id,
          terms_version: "anterior",
        })
      ).error?.code,
    ).toBe("42501");

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/aceitar-termos$/);
    for (const path of [
      "/alunos",
      "/agenda",
      "/cobrancas",
      "/mais",
      "/configuracoes",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/aceitar-termos$/);
    }
    for (const path of ["/termos", "/privacidade"]) {
      await page.locator(`a[href="${path}"]`).click();
      await expect(page).toHaveURL(new URL(path, "http://localhost:3000").href);
      await page.goBack();
    }
    const checkbox = page.getByRole("checkbox", {
      name: "Li e aceito os Termos de uso e a Política de privacidade",
    });
    const submit = page.getByRole("button", { name: "Continuar" });
    await expect(checkbox).not.toBeChecked();
    await expect(submit).toBeDisabled();
    await checkbox.check();
    await submit.click();
    await expect(
      page.getByRole("heading", { name: "Hoje", exact: true }),
    ).toBeVisible();
    await page.goto("/configuracoes");
    await expect(
      page.getByText(/Termos aceitos em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/),
    ).toContainText(`(versão ${legalVersion})`);
    await page.goto("/aceitar-termos");
    await expect(page).toHaveURL("http://localhost:3000/");
  } finally {
    expect((await admin.auth.admin.deleteUser(data.user.id)).error).toBeNull();
  }
});
