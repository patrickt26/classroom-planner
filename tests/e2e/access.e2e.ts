import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "playwright/test";
import { login } from "./login";

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
  const secret = process.env.E2E_SUPABASE_SECRET_KEY;
  if (!secret)
    throw new Error("Exporte a SECRET_KEY local em E2E_SUPABASE_SECRET_KEY.");
  const admin = createClient("http://127.0.0.1:54321", secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `professora-${randomUUID()}@example.test`;
  const password = `Senha-ficticia-${randomUUID()}`;
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
    .getByRole("link", { name: "Aceitar convite e definir senha" })
    .click();
  await expect(page).toHaveURL("http://localhost:3000/nova-senha");
  await page.getByLabel("Nova senha", { exact: false }).fill(password);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(
    page.getByRole("heading", { name: "Hoje", exact: true }),
  ).toBeVisible();
  await page.context().clearCookies();
  await login(page, email, password);
});
