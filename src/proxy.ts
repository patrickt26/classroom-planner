import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  return updateSession(request, requiresSession);
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|.*\\.(?:ico|svg|png|jpe?g|gif|webp|avif|bmp|tiff?)$).*)",
  ],
};
