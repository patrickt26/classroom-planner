import Link from "next/link";
import type { ReactNode } from "react";

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
        <section className="mt-6 border-t pt-5">
          <h2 className="text-xl font-semibold text-brown">Contato</h2>
          {contactEmail ? (
            <a
              className="inline-flex min-h-11 max-w-full items-center break-all underline underline-offset-4"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Para falar com a plataforma, solicite o contato a quem enviou seu
              convite para o piloto.
            </p>
          )}
        </section>
        <footer className="mt-5 text-sm text-muted-foreground">
          Texto modelo. Recomenda-se revisão jurídica.
        </footer>
      </article>
    </main>
  );
}
