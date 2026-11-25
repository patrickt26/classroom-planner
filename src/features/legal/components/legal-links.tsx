import Link from "next/link";

const linkClass =
  "inline-flex min-h-11 items-center underline underline-offset-4";

export function LegalLinks({ showContact = false }: { showContact?: boolean }) {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <nav
      aria-label="Termos e privacidade"
      className="flex flex-wrap gap-x-5 text-sm"
    >
      <Link className={linkClass} href="/termos">
        Termos de uso
      </Link>
      <Link className={linkClass} href="/privacidade">
        Política de privacidade
      </Link>
      {showContact && contactEmail && (
        <a className={linkClass} href={`mailto:${contactEmail}`}>
          Contato de privacidade
        </a>
      )}
    </nav>
  );
}
