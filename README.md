# classroom-planner

Plataforma web para professoras particulares do Ensino Fundamental organizarem alunos, agenda,
planejamento de aulas, registro pós-aula, acompanhamento pedagógico e cobranças, pensada para o celular.

> Projeto em construção no Marco 1.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase (Postgres, Auth, RLS, Storage, pg_cron) · Vercel

Por que essa stack: [docs/decisions/0001-stack.md](docs/decisions/0001-stack.md)

## Como o projeto é desenvolvido

- Cada funcionalidade é uma **issue** com contexto, escopo e critérios de aceite, organizada no quadro do GitHub Projects e em milestones (marcos).
- Cada issue vira **um PR pequeno**, que explica **o quê**, **onde** e **por quê** ([template](.github/pull_request_template.md)).
- Regras para quem contribui, inclusive agentes de código: [AGENTS.md](AGENTS.md).
- Decisões de arquitetura ficam registradas em [docs/decisions](docs/decisions).

## Marcos

1. **O dia a dia:** alunos, agenda, planejamento, registro pós-aula, continuidade pedagógica e cobranças por aula.
2. **Biblioteca:** materiais organizados e reutilizáveis.
3. **Assistente:** apoio à produção de materiais com IA.
4. **Portal do aluno:** materiais e atividades para alunos e responsáveis.

## Rodando localmente

Use Node.js 22 (a partir de 22.12), 24 ou 26+ e pnpm na versão indicada em `package.json`.
Com o Corepack instalado, execute `corepack enable pnpm` para que o comando
`pnpm` use a versão do projeto. Você também pode usar `corepack pnpm` no
lugar de `pnpm`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra [localhost:3000](http://localhost:3000) para ver a página inicial.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O comando `pnpm lint` verifica lint e formatação com o Biome. Use
`pnpm format` para aplicar a formatação.
