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
- Para reproduzir os testes ponta a ponta ou publicar uma versão, siga o [checklist de deploy](docs/checklist-de-deploy.md).

## Marcos

1. **O dia a dia:** alunos, agenda, planejamento, registro pós-aula, continuidade pedagógica e cobranças por aula.
2. **Biblioteca:** materiais organizados e reutilizáveis.
3. **Assistente:** apoio à produção de materiais com IA.
4. **Portal do aluno:** materiais e atividades para alunos e responsáveis.

## Rodando localmente

Use Node.js 26 e pnpm na versão indicada em `package.json`.
Com o Corepack instalado, execute `corepack enable pnpm` para que o comando
`pnpm` use a versão do projeto. Você também pode usar `corepack pnpm` no
lugar de `pnpm`.

O projeto usa quebras de linha LF, e o `.gitattributes` garante esse formato no Windows.

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

### Banco local

Com o Docker em execução, inicie o Supabase local pela CLI instalada no projeto.
Na primeira execução, a CLI baixa as imagens dos serviços.
O Studio fica desativado devido a um erro de inicialização na imagem usada
pela CLI 3.2.0. O Analytics também fica desativado no ambiente local.
Use a CLI para operar o banco local.

```sh
pnpm exec supabase start
cp .env.example .env.local
```

Em `.env.local`, preencha `NEXT_PUBLIC_SUPABASE_URL` com `API_URL` e
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com `PUBLISHABLE_KEY`. Os dois valores
aparecem na saída de `pnpm exec supabase status`.

Depois de adicionar uma migração, recrie o banco local, rode o pgTAP e regenere
os tipos a partir do schema `public`. O comando de geração aplica a formatação
do Biome. O reset descarta os dados locais.

```sh
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm db:types
```

Depois do reset, acesse [Entrar](http://localhost:3000/entrar) com o e-mail fictício
`professora.exemplo@example.test` e a senha local `senha-de-teste`. Em **Alunos**, confira as fichas de exemplo.
Em **Agenda**, a semana atual tem uma aula confirmada e a lista de reposições pendentes tem uma aula.
Navegue para a semana anterior para ver uma aula realizada, uma cancelada e uma com falta.
Nas próximas semanas, confira as aulas geradas pelas recorrências de terça e quinta.

Versione a migração e o arquivo gerado `src/types/database.ts` juntos.
Para encerrar os serviços, use `pnpm exec supabase stop`.
