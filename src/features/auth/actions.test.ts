import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { afterEach, expect, test, vi } from "vitest";
import { logoutEverywhere, recover, resetPassword } from "./actions";

const { resetPasswordForEmail, signOut, updateUser } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  updateUser: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () => new Headers({ origin: "https://other.example.test" }),
  ),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { resetPasswordForEmail, signOut, updateUser },
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function passwordForm() {
  const form = new FormData();
  form.set("password", "senha-ficticia-123");
  return form;
}

test("saída de todos os aparelhos usa escopo global e exibe aviso", async () => {
  await logoutEverywhere();

  expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: "global" });
  expect(redirect).toHaveBeenCalledWith("/entrar?aviso=sessoes-encerradas");
});

test("falha na saída global permite tentar novamente", async () => {
  signOut.mockResolvedValueOnce({ error: new Error("detalhe interno") });

  await expect(logoutEverywhere()).resolves.toEqual({
    variant: "error",
    message: "Não foi possível sair de todos os aparelhos. Tente novamente.",
  });
  expect(redirect).not.toHaveBeenCalled();
});

test("redefinição de senha encerra apenas as outras sessões após salvar", async () => {
  await resetPassword(null, passwordForm());

  expect(updateUser).toHaveBeenCalledExactlyOnceWith({
    password: "senha-ficticia-123",
  });
  expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: "others" });
  expect(updateUser).toHaveBeenCalledBefore(signOut);
  expect(redirect).toHaveBeenCalledWith("/aceitar-termos");
});

test("falha ao salvar a senha preserva as sessões", async () => {
  updateUser.mockResolvedValueOnce({ error: new Error("falha ao salvar") });

  await expect(resetPassword(null, passwordForm())).resolves.toMatchObject({
    variant: "error",
  });
  expect(signOut).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});

test("falha ao encerrar outras sessões registra aviso sem impedir a troca de senha", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  signOut.mockResolvedValueOnce({ error: new Error("detalhe interno") });

  await resetPassword(null, passwordForm());

  expect(log).toHaveBeenCalledExactlyOnceWith(
    "Não foi possível encerrar as outras sessões após redefinir a senha.",
  );
  expect(redirect).toHaveBeenCalledWith("/aceitar-termos");
});

function recoveryForm() {
  const form = new FormData();
  form.set("email", "professora@example.test");
  return form;
}

test("confirmationUrl usa NEXT_PUBLIC_SITE_URL e ignora Origin", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.test/");

  await recover(null, recoveryForm());

  expect(resetPasswordForEmail).toHaveBeenCalledWith(
    "professora@example.test",
    {
      redirectTo: "https://app.example.test/confirmar",
    },
  );
  expect(headers).not.toHaveBeenCalled();
});

test.each([
  [undefined, "Configure NEXT_PUBLIC_SITE_URL"],
  ["/relativa", "URL absoluta válida"],
  ["http://app.example.test", "deve usar HTTPS"],
])(
  "confirmationUrl rejeita configuração de produção %s",
  async (url, message) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", url);

    await expect(recover(null, recoveryForm())).rejects.toThrow(message);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  },
);

test("confirmationUrl aceita HTTP no desenvolvimento", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

  await recover(null, recoveryForm());

  expect(resetPasswordForEmail).toHaveBeenCalledWith(
    "professora@example.test",
    {
      redirectTo: "http://localhost:3000/confirmar",
    },
  );
});
