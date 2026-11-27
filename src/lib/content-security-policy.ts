export function contentSecurityPolicy(nonce?: string) {
  const connections = ["'self'"];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    connections.push(url.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    connections.push(url.origin);
  }

  const scripts = nonce
    ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
    : ["'none'"];
  if (nonce && process.env.NODE_ENV === "development")
    scripts.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    `script-src ${scripts.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connections.join(" ")}`,
    "img-src 'self' data: blob:",
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && nonce
      ? "frame-src https://challenges.cloudflare.com"
      : "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}
