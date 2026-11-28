import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "playwright/test";
import type { Database } from "../../src/types/database";
import { login } from "./login";

test("a professora confirma a exclusão de um aluno arquivado e conserva a cobrança", async ({
  page,
}) => {
  const email = "professora.exclusao@example.test";
  const password = "senha-de-teste";
  const name = `Aluno de exclusão ${randomUUID().slice(0, 8)}`;
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    process.loadEnvFile(".env.local");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key)
    throw new Error("Defina a chave pública do Supabase local para o E2E.");
  const client = createClient<Database>("http://127.0.0.1:54321", key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  expect(error).toBeNull();
  if (!auth.user) throw new Error("Sessão fictícia indisponível.");
  const workspace = await client
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", auth.user.id)
    .single()
    .throwOnError();
  const ws = workspace.data.workspace_id;
  const subject = await client
    .from("subjects")
    .select("id")
    .eq("workspace_id", ws)
    .eq("name", "Matemática")
    .single()
    .throwOnError();
  await client
    .rpc("save_student", {
      target_workspace_id: ws,
      student_name: name,
      student_hourly_rate: 8250,
      student_is_free: false,
      selected_subject_ids: [subject.data.id],
      guardian_name: "Responsável de exclusão",
      guardian_relationship: "Tutor",
      guardian_consent_confirmed: true,
    })
    .throwOnError();
  const student = await client
    .from("students")
    .select("id")
    .eq("workspace_id", ws)
    .eq("name", name)
    .single()
    .throwOnError();
  const id = student.data.id;
  const now = new Date();
  const lesson = await client
    .from("lessons")
    .insert({
      workspace_id: ws,
      student_id: id,
      subject_id: subject.data.id,
      starts_at: now.toISOString(),
      duration_minutes: 60,
      modality: "presencial",
      status: "realizada",
    })
    .select("id")
    .single()
    .throwOnError();
  const note = `Pagamento de ${name}`;
  await client
    .rpc("record_payment", {
      target_workspace_id: ws,
      target_student_id: id,
      lesson_ids: [lesson.data.id],
      payment_date: now.toLocaleDateString("sv-SE", {
        timeZone: "America/Sao_Paulo",
      }),
      payment_method: "pix",
      payment_note: note,
    })
    .throwOnError();

  await login(page, email, password);
  await page.goto("/cobrancas");
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  const profile = `/alunos/${id}`;
  await page.goto(profile);
  const eraseLink = page.getByRole("link", { name: "Excluir dados do aluno" });
  await expect(eraseLink).toHaveCount(0);
  await page.getByRole("link", { name: "Editar aluno" }).click();
  await page.getByRole("button", { name: "Arquivar aluno" }).click();
  await page.getByRole("link", { name, exact: true }).click();
  await eraseLink.click();
  const field = page.getByLabel(
    "Digite o nome completo do aluno para confirmar",
  );
  const erase = page.getByRole("button", { name: "Excluir dados do aluno" });
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(field).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  await expect(erase).toBeDisabled();
  await field.fill(name.toLowerCase());
  await expect(erase).toBeDisabled();
  await field.fill(name);
  await erase.click();
  await expect(page).toHaveURL(/situacao=arquivados&aviso=excluido/);
  await expect(page.getByText("Dados do aluno excluídos.")).toBeVisible();
  await expect(page.locator(`a[href="${profile}"]`)).toHaveText(
    "Aluno removido",
  );
  await page.goto(`${profile}/editar`);
  await expect(page).toHaveURL(new RegExp(`${profile}$`));
  await expect(eraseLink).toHaveCount(0);
  await page.goto("/cobrancas");
  const payment = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Aluno removido", exact: true }),
      hasText: "Pix",
    })
    .first();
  await expect(payment.getByText("R$ 82,50", { exact: true })).toBeVisible();
  await expect(page.getByText(note, { exact: true })).toHaveCount(0);
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
});
