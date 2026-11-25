import Link from "next/link";

const linkClass =
  "inline-flex min-h-11 items-center underline underline-offset-4";

export function LegalLinks({
  showLoginAgreement = false,
  showContact = false,
}: {
  showLoginAgreement?: boolean;
  showContact?: boolean;
}) {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <nav
      aria-label="Termos e privacidade"
      className={
        showLoginAgreement ? "text-sm" : "flex flex-wrap gap-x-5 text-sm"
      }
    >
      {showLoginAgreement && "Ao entrar, você concorda com os "}
      <Link className={linkClass} href="/termos">
        Termos de uso
      </Link>
      {showLoginAgreement && " e a "}
      <Link className={linkClass} href="/privacidade">
        Política de privacidade
      </Link>
      {showLoginAgreement && "."}
      {showContact && contactEmail && (
        <a className={linkClass} href={`mailto:${contactEmail}`}>
          Contato de privacidade
        </a>
      )}
    </nav>
  );
}
