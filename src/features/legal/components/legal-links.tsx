import Link from "next/link";

const linkClass =
  "inline-flex min-h-11 items-center underline underline-offset-4";

export function LegalLinks() {
  return (
    <footer className="border-t pt-2 text-sm text-muted-foreground">
      Ao entrar, você concorda com os{" "}
      <Link className={linkClass} href="/termos">
        Termos de uso
      </Link>{" "}
      e a{" "}
      <Link className={linkClass} href="/privacidade">
        Política de privacidade
      </Link>
      .
    </footer>
  );
}
