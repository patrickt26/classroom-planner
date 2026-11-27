import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  login,
  logoutEverywhere,
  recover,
  resetPassword,
  signup,
} from "./actions";
import { captchaError } from "./captcha";

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () => new Headers({ origin: "https://other.example.test" }),
  ),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("./signup-enabled", () => ({ signupEnabled: true }));

const email = "professora@example.test";
const password = "SenhaFicticia123";
const confirmationUrl = "https://app.example.test/confirmar";
const captchaToken = "token-ficticio";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.test/");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  auth.signInWithPassword.mockResolvedValue({
    error: { code: "invalid_credentials" },
  });
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.updateUser.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const cases = [
  {
    action: login,
    method: auth.signInWithPassword,
    args: (captcha: object) => [
      Object.keys(captcha).length
        ? { email, password, options: captcha }
        : { email, password },
    ],
  },
  {
    action: signup,
    method: auth.signUp,
    args: (captcha: object) => [
      {
        email,
        password,
        options: { emailRedirectTo: confirmationUrl, ...captcha },
      },
    ],
  },
  {
    action: recover,
    method: auth.resetPasswordForEmail,
    args: (captcha: object) => [
      email,
      { redirectTo: confirmationUrl, ...captcha },
    ],
  },
];

function form(token?: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  if (token !== undefined) data.set("captchaToken", token);
  return data;
}

test.each(cases)(
  "$action.name forwards the CAPTCHA token when configured",
  async ({ action, method, args }) => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "chave-publica-ficticia");
    await action(null, form(captchaToken));
    expect(method).toHaveBeenCalledExactlyOnceWith(...args({ captchaToken }));
  },
);

test.each(cases)(
  "$action.name ignores submitted tokens without configuration",
  async ({ action, method, args }) => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    await action(null, form(captchaToken));
    expect(method).toHaveBeenCalledExactlyOnceWith(...args({}));
  },
);

test.each(cases)(
  "$action.name handles missing, invalid and rejected tokens",
  async ({ action, method }) => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "chave-publica-ficticia");
    for (const token of [undefined, " ", "x".repeat(2049)]) {
      expect(await action(null, form(token))).toEqual(captchaError);
    }
    expect(method).not.toHaveBeenCalled();

    method.mockResolvedValue({ error: { code: "captcha_failed" } });
    expect(await action(null, form(captchaToken))).toEqual(captchaError);
  },
);

test("confirmationUrl usa NEXT_PUBLIC_SITE_URL e ignora Origin", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.test/");

  await recover(null, form());

  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
    redirectTo: confirmationUrl,
  });
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

    await expect(recover(null, form())).rejects.toThrow(message);
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  },
);

test("confirmationUrl aceita HTTP no desenvolvimento", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

  await recover(null, form());

  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
    redirectTo: "http://localhost:3000/confirmar",
  });
});

function passwordForm() {
  const form = new FormData();
  form.set("password", "senha-ficticia-123");
  return form;
}

test("saída de todos os aparelhos usa escopo global e exibe aviso", async () => {
  await logoutEverywhere();

  expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "global" });
  expect(redirect).toHaveBeenCalledWith("/entrar?aviso=sessoes-encerradas");
});

test("falha na saída global permite tentar novamente", async () => {
  auth.signOut.mockResolvedValueOnce({ error: new Error("detalhe interno") });

  await expect(logoutEverywhere()).resolves.toEqual({
    variant: "error",
    message: "Não foi possível sair de todos os aparelhos. Tente novamente.",
  });
  expect(redirect).not.toHaveBeenCalled();
});

test("redefinição de senha encerra apenas as outras sessões após salvar", async () => {
  await resetPassword(null, passwordForm());

  expect(auth.updateUser).toHaveBeenCalledExactlyOnceWith({
    password: "senha-ficticia-123",
  });
  expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "others" });
  expect(auth.updateUser).toHaveBeenCalledBefore(auth.signOut);
  expect(redirect).toHaveBeenCalledWith("/aceitar-termos");
});

test("falha ao salvar a senha preserva as sessões", async () => {
  auth.updateUser.mockResolvedValueOnce({
    error: new Error("falha ao salvar"),
  });

  await expect(resetPassword(null, passwordForm())).resolves.toMatchObject({
    variant: "error",
  });
  expect(auth.signOut).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});

test("falha ao encerrar outras sessões registra aviso sem impedir a troca de senha", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  auth.signOut.mockResolvedValueOnce({ error: new Error("detalhe interno") });

  await resetPassword(null, passwordForm());

  expect(log).toHaveBeenCalledExactlyOnceWith(
    "Não foi possível encerrar as outras sessões após redefinir a senha.",
  );
  expect(redirect).toHaveBeenCalledWith("/aceitar-termos");
});
