import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";
import { GET } from "./route";

const { verifyOtp } = vi.hoisted(() => ({ verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp } }),
}));

test.each([
  ["signup", "/"],
  ["invite", "/nova-senha"],
  ["recovery", "/nova-senha"],
])("confirma o token de %s e redireciona para %s", async (type, path) => {
  verifyOtp.mockResolvedValueOnce({ error: null });
  const request = new NextRequest(
    `http://localhost:3000/confirmar?token_hash=exemplo&type=${type}`,
  );
  const response = await GET(request);
  expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "exemplo", type });
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe(path);
});

test("convite expirado volta ao login com aviso", async () => {
  verifyOtp.mockResolvedValueOnce({ error: { message: "expired" } });
  const response = await GET(
    new NextRequest(
      "http://localhost:3000/confirmar?token_hash=expirado&type=invite",
    ),
  );
  expect(response.headers.get("location")).toBe("/entrar?aviso=link");
});
