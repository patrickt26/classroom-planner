# classroom-planner

Plataforma web para professoras particulares do Ensino Fundamental organizarem alunos, agenda,
planejamento de aulas, registro pós-aula, acompanhamento pedagógico e cobranças, pensada para o celular.

> Projeto em construção. Este repositório está no "commit zero": regras do projeto e decisões iniciais.
> O código começa a partir das issues do Marco 1.

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

> Será preenchido na issue de setup.
