import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresSession =
    pathname === "/mais" ||
    pathname.startsWith("/mais/") ||
    pathname === "/nova-senha" ||
    pathname === "/nova-senha/";

  return updateSession(request, requiresSession);
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|.*\\.(?:ico|svg|png|jpe?g|gif|webp|avif|bmp|tiff?)$).*)",
  ],
};
