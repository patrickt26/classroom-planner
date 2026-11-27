import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { login, recover, signup } from "./actions";
import { captchaError } from "./captcha";

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "https://app.example.test" }),
}));
vi.mock("./signup-enabled", () => ({ signupEnabled: true }));

const email = "professora@example.test";
const password = "SenhaFicticia123";
const confirmationUrl = "https://app.example.test/confirmar";
const captchaToken = "token-ficticio";

beforeEach(() => {
  vi.resetAllMocks();
  auth.signInWithPassword.mockResolvedValue({
    error: { code: "invalid_credentials" },
  });
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
});

afterEach(() => vi.unstubAllEnvs());

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
