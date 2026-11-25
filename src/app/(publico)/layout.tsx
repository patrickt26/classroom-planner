import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LegalLinks } from "../../features/legal/components/legal-links";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  alternates: { canonical: "./" },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        className="mb-2 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
        href="/entrar"
      >
        Ir para o login
      </Link>
      <article className="rounded-xl border border-t-4 border-t-mustard bg-card p-5 sm:p-8">
        {children}
        <footer className="mt-6 space-y-2 border-t pt-2 text-sm text-muted-foreground">
          <LegalLinks showContact />
          {!contactEmail && (
            <p>
              Para falar com a plataforma, solicite o contato a quem enviou seu
              convite para o piloto.
            </p>
          )}
          <p>Texto modelo. Recomenda-se revisão jurídica.</p>
        </footer>
      </article>
    </main>
  );
}
