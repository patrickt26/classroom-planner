import { beforeEach, expect, test, vi } from "vitest";
import { acceptTerms } from "./actions";
import { legalVersion } from "./version";

const { from, upsert, getAuthenticatedUserId } = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  getAuthenticatedUserId: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from }),
  getAuthenticatedUserId,
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect ${path}`);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue({ upsert });
  upsert.mockResolvedValue({ error: null });
  getAuthenticatedUserId.mockResolvedValue("conta-ficticia");
});

test.each([
  [null, legalVersion],
  ["false", legalVersion],
  ["on", "versão anterior"],
])("recusa o aceite %s para a versão %s", async (accepted, version) => {
  const form = new FormData();
  if (accepted) form.set("accepted", accepted);
  form.set("version", version);
  expect(await acceptTerms(null, form)).toMatchObject({ variant: "error" });
  expect(from).not.toHaveBeenCalled();
});

test("registra a versão vigente para a conta autenticada e preserva o primeiro aceite", async () => {
  const form = new FormData();
  form.set("accepted", "on");
  form.set("version", legalVersion);
  form.set("user_id", "outra-conta");
  form.set("accepted_at", "2000-01-01");
  await expect(acceptTerms(null, form)).rejects.toThrow("redirect /");
  expect(from).toHaveBeenCalledWith("terms_acceptances");
  expect(upsert).toHaveBeenCalledWith(
    { user_id: "conta-ficticia", terms_version: legalVersion },
    { onConflict: "user_id,terms_version", ignoreDuplicates: true },
  );
});
