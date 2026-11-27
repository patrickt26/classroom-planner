import {
  unstable_doesMiddlewareMatch,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import nextConfig from "../next.config";
import { config, proxy } from "./proxy";

const { getClaims } = vi.hoisted(() => ({ getClaims: vi.fn() }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims } }),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  getClaims.mockReset().mockResolvedValue({ data: null });
});

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

afterEach(() => vi.unstubAllEnvs());

test.each([
  "/",
  "/entrar",
  "/agenda/nova",
  "/_next/static/chunks/app.js",
  "/marca.svg",
])("sets global security headers for %s", async (path) => {
  const { headers } = await unstable_getResponseFromNextConfig({
    url: request(path).url,
    nextConfig,
  });
  expect(headers.get("strict-transport-security")).toBe(
    "max-age=63072000; includeSubDomains",
  );
  expect(headers.get("x-content-type-options")).toBe("nosniff");
  expect(headers.get("x-frame-options")).toBe("DENY");
  expect(headers.get("referrer-policy")).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(headers.get("permissions-policy")).toContain(
    "camera=(), microphone=(), geolocation=()",
  );
  expect(headers.get("content-security-policy")?.split("; ")).toContain(
    "script-src 'none'",
  );
});

test("forwards a fresh script nonce to Next.js and sends the same policy to the browser", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.test");
  const login = request("/entrar");
  login.headers.set("Content-Security-Policy", "script-src 'unsafe-inline'");
  const { headers } = await proxy(login);
  const policy = headers.get("content-security-policy");
  expect(headers.get("x-middleware-request-content-security-policy")).toBe(
    policy,
  );
  expect(policy?.split("; ")).toEqual(
    expect.arrayContaining([
      "default-src 'self'",
      expect.stringMatching(
        /^script-src 'self' 'nonce-[A-Za-z0-9+/]{22}==' 'strict-dynamic'$/,
      ),
      "connect-src 'self' https://project.example.test wss://project.example.test",
      "img-src 'self' data: blob:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ]),
  );
  const redirect = await proxy(request("/agenda"));
  expect(redirect.headers.get("content-security-policy")).toContain("'nonce-");
  expect(redirect.headers.get("content-security-policy")).not.toBe(policy);
});

test("allows Turnstile frames and forwards the script nonce when configured", async () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "chave-publica-ficticia");
  const login = request("/entrar");
  login.headers.set("x-nonce", "client-nonce");
  const { headers } = await proxy(login);
  const nonce = headers.get("x-middleware-request-x-nonce");
  expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  const policy = headers.get("content-security-policy")?.split("; ");
  expect(policy).toContain("frame-src https://challenges.cloudflare.com");
  expect(
    policy?.find((directive) => directive.startsWith("script-src ")),
  ).toMatch(/^script-src 'self' 'nonce-[A-Za-z0-9+/]{22}==' 'strict-dynamic'/);
  expect(
    policy?.find((directive) => directive.startsWith("script-src ")),
  ).toContain(`'nonce-${nonce}'`);
});

test("allows local Supabase and React debugging during development", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const { headers } = await proxy(request("/entrar"));
  const policy = headers.get("content-security-policy");
  expect(policy).toContain(
    "connect-src 'self' http://localhost:54321 ws://localhost:54321",
  );
  expect(policy).toContain("'unsafe-eval'");
});

test.each([
  "/",
  "/entrar",
  "/criar-conta",
  "/recuperar-senha",
  "/privacidade",
  "/termos",
  "/confirmar?type=recovery",
  "/tema",
  "/tema/mais",
  "/mais-opcoes",
  "/configuracoes-publicas",
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
  "/configuracoes",
  "/configuracoes/perfil",
  "/cobrancas",
  "/nova-senha",
  "/aceitar-termos",
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
