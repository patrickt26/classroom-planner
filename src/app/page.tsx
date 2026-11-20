import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-3 px-6 py-12">
      <h1 className="text-3xl font-semibold">Planejamento de aulas</h1>
      <p>
        Plataforma de organização para professoras particulares do Ensino
        Fundamental.
      </p>

      <Link
        className="inline-flex min-h-11 items-center self-start font-semibold underline underline-offset-4"
        href="/mais"
      >
        Acessar meu espaço
      </Link>
    </main>
  );
}
