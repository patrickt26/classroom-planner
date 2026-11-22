import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const linkSchema = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(["signup", "recovery"]),
});

export async function GET(request: NextRequest) {
  const link = linkSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  let path = "/entrar?aviso=link";
  if (link.success) {
    const client = await createClient();
    const { error } = await client.auth.verifyOtp(link.data);
    if (!error) path = link.data.type === "recovery" ? "/nova-senha" : "/";
  }
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
