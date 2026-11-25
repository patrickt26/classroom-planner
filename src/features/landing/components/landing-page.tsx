import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/features/legal/components/legal-links";
import { platformName } from "@/lib/platform";
import { TodayPreview } from "./today-preview";

const resources = [
  {
    icon: Users,
    title: "Alunos e responsáveis",
    description:
      "Organize as fichas dos alunos e fale com os responsáveis pelo WhatsApp em um toque.",
  },
  {
    icon: CalendarDays,
    title: "Agenda com recorrência",
    description:
      "Programe aulas presenciais ou online com Google Meet e acompanhe faltas, cancelamentos e reposições.",
  },
  {
    icon: ClipboardList,
    title: "Planejamento e registro",
    description:
      "Prepare o plano antes da aula. Depois, registre o que foi trabalhado, as dificuldades e os próximos passos.",
  },
  {
    icon: Receipt,
    title: "Cobranças por aula",
    description:
      "A aula realizada gera uma cobrança pelo valor da hora. Registre um pagamento para quitar várias aulas de uma vez.",
  },
];

const steps = [
  {
    title: "Peça seu convite",
    description: "Envie um e-mail contando que você quer participar do piloto.",
  },
  {
    title: "Receba o e-mail",
    description:
      "O convite chega por e-mail com um link para ativar sua conta.",
  },
  {
    title: "Crie sua senha e comece",
    description: "Abra o link para definir sua senha e acessar seu espaço.",
  },
];

const container = "mx-auto w-full max-w-[70rem] px-5 sm:px-8";
const textLink =
  "inline-flex min-h-11 min-w-11 items-center rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2";

function InviteButton({ href }: { href: string }) {
  return (
    <Button asChild className="min-h-12 gap-2 rounded-full px-5 font-bold">
      <a href={href}>
        Pedir convite <ArrowRight aria-hidden="true" />
      </a>
    </Button>
  );
}

export function LandingPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const inviteHref = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Pedido de convite para o ${platformName}`)}`
    : null;

  return (
    <>
      <header className="border-b bg-card">
        <div
          className={`${container} grid grid-cols-[1fr_auto] items-center gap-x-4 py-3 md:grid-cols-[1fr_auto_auto] md:gap-x-8`}
        >
          <div className="flex items-center gap-2 font-bold text-brown">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-yellow text-navy">
              <CalendarCheck aria-hidden="true" className="size-5" />
            </span>
            {platformName}
          </div>
          <nav
            aria-label="Nesta página"
            className="col-span-2 row-start-2 flex flex-wrap gap-x-6 text-sm md:col-span-1 md:col-start-2 md:row-start-1"
          >
            <a className={textLink} href="#recursos">
              Recursos
            </a>
            <a className={textLink} href="#como-funciona">
              Como funciona
            </a>
          </nav>
          <Button
            asChild
            variant="outline"
            className="col-start-2 row-start-1 rounded-full border-navy bg-transparent px-4 md:col-start-3"
          >
            <Link href="/entrar">Entrar</Link>
          </Button>
        </div>
      </header>

      <main>
        <section
          aria-labelledby="apresentacao"
          className={`${container} grid items-center gap-10 py-10 sm:py-14 md:grid-cols-[1.2fr_1fr] lg:gap-16 lg:py-16`}
        >
          <div>
            <p className="mb-4 w-fit rounded-full bg-yellow px-3 py-1.5 text-sm font-bold">
              Para professoras e professores particulares
            </p>
            <h1
              id="apresentacao"
              className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-brown sm:text-5xl"
            >
              Sua rotina de aulas particulares organizada em um só lugar
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed">
              Alunos, agenda, planejamento e cobranças no celular, no tablet ou
              no computador. Menos planilha e caderno, mais tempo para ensinar.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {inviteHref && <InviteButton href={inviteHref} />}
              <Link href="/entrar" className={`${textLink} underline`}>
                Já tenho conta
              </Link>
            </div>
            <p className="mt-3 text-sm text-secondary-text">
              Acesso por convite enquanto a plataforma está em fase piloto.
            </p>
          </div>
          <TodayPreview />
        </section>

        <section aria-labelledby="recursos" className="border-y bg-card">
          <div className={`${container} grid gap-6 py-10 sm:py-14`}>
            <h2
              id="recursos"
              className="text-3xl font-bold tracking-tight text-brown"
            >
              Tudo o que a rotina de aulas pede
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {resources.map(({ title, description, icon: Icon }) => (
                <li
                  key={title}
                  className="grid content-start gap-3 rounded-2xl border bg-background p-5"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-yellow">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="text-lg font-bold text-brown">{title}</h3>
                  <p className="leading-relaxed">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className={`${container} grid gap-8 py-10 sm:gap-10 sm:py-14`}>
          <section aria-labelledby="como-funciona" className="grid gap-6">
            <h2
              id="como-funciona"
              className="text-3xl font-bold tracking-tight text-brown"
            >
              Como funciona o convite
            </h2>
            <ol className="grid gap-5 md:grid-cols-3">
              {steps.map(({ title, description }, index) => (
                <li key={title} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-mustard/80 font-bold"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-brown">{title}</h3>
                    <p className="mt-1 leading-relaxed">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="dados"
            className="flex flex-col items-start gap-3 rounded-2xl bg-beige p-5 sm:flex-row sm:gap-4 sm:p-6"
          >
            <ShieldCheck aria-hidden="true" className="size-7 shrink-0" />
            <div>
              <h2 id="dados" className="text-xl font-bold text-brown">
                Seus dados e os dos seus alunos, sob seu controle
              </h2>
              <p className="mt-2 max-w-3xl leading-relaxed">
                Cada professora só enxerga o próprio espaço. Você pode usar
                apelidos para os alunos e deixar a escola em branco. A
                plataforma não vende dados nem os compartilha para publicidade.
              </p>
              <Link href="/privacidade" className={`${textLink} underline`}>
                Leia a política de privacidade
              </Link>
            </div>
          </section>
        </div>

        {inviteHref && (
          <section aria-labelledby="convite" className="bg-yellow">
            <div
              className={`${container} flex flex-wrap items-center justify-between gap-4 py-7 sm:py-9`}
            >
              <h2
                id="convite"
                className="text-3xl font-bold tracking-tight text-brown"
              >
                Quer organizar suas aulas?
              </h2>
              <InviteButton href={inviteHref} />
            </div>
          </section>
        )}
      </main>

      <footer className="bg-navy text-white">
        <div
          className={`${container} flex flex-wrap items-center justify-between gap-x-8 gap-y-1 py-4`}
        >
          <p className="font-bold">{platformName}</p>
          <div className="flex flex-wrap items-center gap-x-5">
            <LegalLinks showContact />
            <Link className={`${textLink} text-sm`} href="/entrar">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
