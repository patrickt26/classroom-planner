import { headers } from "next/headers";
import { afterEach, expect, test, vi } from "vitest";
import { recover } from "./actions";

const { resetPasswordForEmail } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () => new Headers({ origin: "https://other.example.test" }),
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { resetPasswordForEmail } }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
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
