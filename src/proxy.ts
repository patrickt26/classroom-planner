import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { contentSecurityPolicy } from "./lib/content-security-policy";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // /privacidade e /termos ficam fora da lista de rotas protegidas.
  const requiresSession =
    pathname === "/" ||
    pathname === "/cobrancas" ||
    pathname.startsWith("/cobrancas/") ||
    pathname === "/alunos" ||
    pathname.startsWith("/alunos/") ||
    pathname === "/agenda" ||
    pathname.startsWith("/agenda/") ||
    pathname === "/mais" ||
    pathname.startsWith("/mais/") ||
    pathname === "/configuracoes" ||
    pathname.startsWith("/configuracoes/") ||
    pathname === "/nova-senha" ||
    pathname === "/nova-senha/";

  const policy = contentSecurityPolicy(randomBytes(16).toString("base64"));
  request.headers.set("Content-Security-Policy", policy);
  const response = await updateSession(request, requiresSession);
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|.*\\.(?:ico|svg|png|jpe?g|gif|webp|avif|bmp|tiff?)$).*)",
  ],
};
