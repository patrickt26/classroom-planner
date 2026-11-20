# AGENTS.md

Regras deste repositório para agentes de código (Codex e similares) e para qualquer pessoa que contribua.
Leia este arquivo inteiro antes de começar qualquer tarefa.

## O produto

Plataforma web para **professoras particulares do Ensino Fundamental** organizarem o dia a dia:
alunos, agenda, planejamento de aulas, registro pós-aula, acompanhamento pedagógico e cobranças.

- Uso principal: **celular** (depois tablet e computador). Toda tela nasce mobile-first.
- Multi-professora: cada professora tem um **workspace** isolado. Nenhum dado cruza workspaces.
- Os dados envolvem **crianças e adolescentes**. Privacidade (LGPD) é requisito, não detalhe.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front + backend | Next.js (App Router) + TypeScript, regras de negócio em Server Actions e Route Handlers |
| UI | Tailwind CSS + shadcn/ui |
| Banco | Supabase Postgres (migrações SQL versionadas em `supabase/migrations`) |
| Login | Supabase Auth com `@supabase/ssr` |
| Autorização | Row Level Security (RLS) por `workspace_id` |
| Arquivos | Supabase Storage, bucket privado, URLs assinadas |
| Agendamento | `pg_cron` |
| Validação | Zod |
| Testes | Vitest (unidade), pgTAP (RLS), Playwright (ponta a ponta) |

Não adicione bibliotecas novas sem justificar no PR (seção "Por quê").

## Estrutura de pastas

```
supabase/migrations/   SQL versionado: tabelas, índices, RLS, pg_cron (fonte da verdade do banco)
supabase/seed.sql      dados FICTÍCIOS para desenvolvimento
supabase/tests/        testes de RLS (pgTAP)
src/app/               rotas do Next.js; (auth), (professora), (aluno)
src/features/<area>/   actions.ts (escrita), queries.ts (leitura), schema.ts (Zod), components/
src/components/ui/     componentes base (shadcn/ui com o tema do projeto)
src/lib/supabase/      clientes do Supabase (navegador, servidor, middleware)
src/types/database.ts  GERADO pelo Supabase CLI, nunca editar à mão
docs/decisions/        ADRs (registros de decisão)
tests/e2e/             Playwright
```

Organize por **funcionalidade** (`features/students`, `features/lessons`...), não por tipo de arquivo.

## Regras obrigatórias

### Privacidade e dados
1. **Nunca** use dados reais de pessoas no código, testes, seeds, exemplos ou documentação. Use nomes inventados ("Aluno A", "Beatriz", "Professora Exemplo").
2. Nome, marca, slogan e cabeçalho da professora vêm das **configurações do workspace** no banco. Nunca escreva o nome de uma professora real no código.
3. **Nunca** commite segredos. Variáveis novas vão em `.env.example` sem valor. A chave `service_role` do Supabase nunca vai para o navegador.
4. Toda tabela com dados de usuário tem `workspace_id` e **RLS habilitado** com policies explícitas, no mesmo PR que a cria, com testes em `supabase/tests/`.
5. Observações com `visibility = 'internal'` nunca podem ser lidas por aluno ou responsável.

### Banco de dados
6. Toda mudança de schema é uma **nova migração** em `supabase/migrations/`. Nunca edite uma migração que já foi mesclada na `main`.
7. Registros pedagógicos (`lesson_notes`, `skill_records`, `observations`) **não são sobrescritos**: editar cria uma nova linha (`supersedes_id`).
8. Após mudar o schema, regenere `src/types/database.ts`.

### Código
9. TypeScript estrito. Sem `any` sem justificativa.
10. Toda entrada de usuário passa por um schema Zod no servidor.
11. Interface em **português do Brasil**; código (nomes de variáveis, funções, tabelas) em **inglês**.
12. Acessibilidade: botões e links reais, `label` em todo campo, área de toque mínima de 44px, contraste mínimo 4,5:1.
13. Não crie botões, telas ou números falsos. Se algo ainda não funciona, não aparece.

### Escopo
14. **Um PR resolve uma issue.** Não inclua mudanças fora do escopo da issue; se encontrar algo, abra uma nova issue.
15. Leia a issue inteira (contexto, escopo, fora do escopo, critérios de aceite) antes de começar.

## Identidade visual

- Cores: marinho `#2F4366` (texto, botões), marrom `#8B3B08` (títulos, marca), mostarda `#E59D2C` e amarelo `#F3D58D` (**apenas** fundos, destaques e ícones; não passam contraste para texto), bege `#EBDCC5` (divisórias), fundo off-white `#FBF7F0`, texto secundário `#5B6170`.
- Fonte: Arimo.
- Celular: barra de navegação inferior (Hoje, Alunos, Agenda, Mais). Computador: menu lateral.

## Comandos

> Serão preenchidos pela issue de setup. Mantenha esta seção atualizada.

```
pnpm dev          # servidor local
pnpm lint         # lint
pnpm typecheck    # checagem de tipos
pnpm test         # testes de unidade
pnpm test:e2e     # testes ponta a ponta
supabase start    # banco local
supabase db reset # recria o banco local com migrações + seed
```

Antes de abrir um PR: `pnpm lint`, `pnpm typecheck` e `pnpm test` precisam passar.

## Comando "next issue"

Quando a mensagem for apenas **"next issue"** (ou "próxima issue"):

1. Liste as issues abertas do repositório pela API pública do GitHub:
   `curl -s "https://api.github.com/repos/patrickt26/classroom-planner/issues?state=open&per_page=100"`
   (ignore itens com o campo `pull_request`, que são PRs).
2. Escolha a issue aberta de **menor número** que:
   - pertença ao milestone aberto mais antigo (hoje, o Marco 1);
   - tenha **todas** as issues da seção "Depende de" já fechadas;
   - ainda não tenha um PR aberto que a mencione (`Closes #N`).
3. Antes de codar, responda em uma linha qual issue escolheu e por quê.
4. Resolva a issue seguindo todas as regras deste arquivo e abra o PR com `Closes #N`.

Se não conseguir acessar a API do GitHub, ou se nenhuma issue cumprir os critérios, **não adivinhe**: pare e peça o número da issue.

## Pull requests

- Título: `<tipo>: <resumo>` (tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- Corpo: preencha **todas** as seções do template (`.github/pull_request_template.md`): **O quê**, **Onde**, **Por quê**, **Como testar**.
- O "Por quê" explica a decisão e as alternativas descartadas, em linguagem que alguém aprendendo a stack entenda.
- Inclua `Closes #<número>` para fechar a issue.
- Decisão de arquitetura nova (biblioteca, padrão, mudança de modelo)? Crie um ADR em `docs/decisions/` no mesmo PR.

## Documentação de referência

- Decisões e seus motivos: `docs/decisions/`.
- Escopo e critérios de cada tarefa: a issue correspondente.
- Modelo de dados: as migrações em `supabase/migrations/` são a fonte da verdade.
