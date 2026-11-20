import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";

import { config, proxy } from "./proxy";

const { getClaims } = vi.hoisted(() => ({ getClaims: vi.fn() }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims } }),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
  getClaims.mockReset().mockResolvedValue({ data: null });
});

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

test.each([
  "/",
  "/entrar",
  "/criar-conta",
  "/recuperar-senha",
  "/confirmar?type=recovery",
  "/tema",
  "/tema/mais",
  "/mais-opcoes",
  "/tela-futura",
])("refreshes the session and allows anonymous access to %s", async (path) => {
  expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
  const response = await proxy(request(path));
  expect(getClaims).toHaveBeenCalledOnce();
  expect(response.headers.get("x-middleware-next")).toBe("1");
});

test.each([
  "/mais",
  "/mais/perfil",
  "/nova-senha",
  "/alunos",
  "/alunos/novo",
  "/alunos/id/editar",
  "/agenda",
  "/agenda/nova",
  "/agenda/id/editar",
])("requires authentication for %s", async (path) => {
  expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
  const anonymous = await proxy(request(path));
  expect(anonymous.headers.get("location")).toBe(
    "http://localhost:3000/entrar",
  );
  getClaims.mockResolvedValue({ data: { claims: { sub: "teacher" } } });
  const authenticated = await proxy(request(path));
  expect(authenticated.headers.get("x-middleware-next")).toBe("1");
});

test.each([
  "/_next/static/chunks/app.js",
  "/_next/image?url=%2Ffoto.png&w=128&q=75",
  "/favicon.ico",
  "/marca.svg",
  "/imagens/foto.jpg",
  "/imagens/capa.avif",
])("skips session processing for %s", (path) => {
  expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(false);
});
