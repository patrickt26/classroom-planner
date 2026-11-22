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
| Lint e formatação | Biome (sem ESLint e sem Prettier) |
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

## Mapa do código

- As **telas autenticadas** ficam em `src/app/(professora)/` e usam o shell e o menu de `src/features/navigation/components/`. O login fica em `src/app/(auth)/`.
- Cada **funcionalidade** em `src/features/<area>/` usa `actions.ts` para Server Actions de escrita, `queries.ts` para leituras, `schema.ts` para validação com Zod e `components/` para a UI da área. Para um CRUD, siga o exemplo de `src/features/students/`.
- Use os **clientes Supabase** de `src/lib/supabase/`. A escolha do workspace da professora fica em `src/features/workspace/queries.ts`.
- Para **RPCs transacionais**, siga `supabase/migrations/20261122170000_confirm_lesson_day_conflicts.sql`. Valide o papel com `public.has_role(...)` e declare `set search_path = ''`, qualificando os objetos com o schema.
- Nomeie as **migrações** como `supabase/migrations/<timestamp>_<descrição>.sql`. Inclua RLS, policies explícitas, grants de escrita por coluna e testes pgTAP em `supabase/tests/` no mesmo PR. Use FKs compostas `(workspace_id, id)` para vínculos entre tabelas com workspace. A migração `20261120020000_students.sql` exemplifica o padrão.
- Acrescente exemplos fictícios ao **seed** em `supabase/seed.sql` para novas tabelas ou fluxos. Após mudar o schema, rode `pnpm db:types` para regenerar `src/types/database.ts`.
- Reutilize os **componentes de UI** de `src/components/ui/`. Para retorno de formulário, use `Alert` e o tipo `FormFeedback` de `src/components/ui/alert.tsx`.

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

**Todo card que cria uma tabela ou um fluxo novo acrescenta dados fictícios de exemplo no `supabase/seed.sql`, no mesmo PR.**

### Código
9. TypeScript estrito. Sem `any` sem justificativa.
10. Toda entrada de usuário passa por um schema Zod no servidor.
11. Interface em **português do Brasil**; código (nomes de variáveis, funções, tabelas) em **inglês**.
12. Acessibilidade: botões e links reais, `label` em todo campo, área de toque mínima de 44px, contraste mínimo 4,5:1.
13. Não crie botões, telas ou números falsos. Se algo ainda não funciona, não aparece.
14. **Responsivo:** toda tela nasce mobile-first, mas precisa funcionar bem em **375px** (celular), **768px** (tablet) e **1280px** (computador).
    No computador, aproveite a largura (ex.: lista e detalhe lado a lado, conteúdo com largura máxima) em vez de esticar a tela do celular.
    A exigência de prints por issue está suspensa até o lançamento (#19), inclusive para as issues #64 a #69, cujo rodapé ainda pede prints.
    Durante a pausa, descreva a verificação na seção **Como testar** do PR, sem anexar prints.

### Escopo
15. **Um PR resolve uma issue.** Não inclua mudanças fora do escopo da issue; se encontrar algo, abra uma nova issue.
16. Leia a issue inteira (contexto, escopo, fora do escopo, critérios de aceite) antes de começar.

## Identidade visual

- Cores: marinho `#2F4366` (texto, botões), marrom `#8B3B08` (títulos, marca), mostarda `#E59D2C` e amarelo `#F3D58D` (**apenas** fundos, destaques e ícones; não passam contraste para texto), bege `#EBDCC5` (divisórias), fundo off-white `#FBF7F0`, texto secundário `#5B6170`.
- Fonte: Arimo.
- Celular: barra de navegação inferior (Hoje, Alunos, Agenda, Mais). Computador: menu lateral.

## Comandos

Use uma versão de Node.js compatível e a versão do pnpm definida em `package.json`.

```
pnpm install --frozen-lockfile # instala as dependências do lockfile
pnpm dev                       # servidor local
pnpm build                     # build de produção
pnpm lint                      # lint e checagem de formatação com Biome
pnpm format                    # aplica a formatação com Biome
pnpm typecheck                 # checagem de tipos
pnpm test                      # testes de unidade
pnpm screenshots <N> <nome>=<rota> ... # prints em 375, 768 e 1280px
```

### Prints de tela para o lançamento

A issue #19 prevê os prints de todas as telas para a documentação do lançamento. A exigência de prints por issue volta no Marco 2, após a #19.

Instale o navegador com `pnpm exec playwright install chromium` na primeira execução ou após atualizar o Playwright. Com o Supabase local populado pelo seed e o servidor já rodando em `http://localhost:3000`, execute `pnpm screenshots 19 hoje=/ alunos=/alunos`. O script faz login com a professora fictícia do seed e salva os arquivos em `docs/screenshots/issue-<N>/<nome>-<largura>.png`.

## Política de verificação

- Antes de abrir um PR, rode `pnpm lint`, `pnpm typecheck` e `pnpm test`.
- Rode `supabase db reset` e, em seguida, `supabase test db` apenas em issues que alterem `supabase/`.
- Durante a verificação, não inicie, reinicie nem encerre o `pnpm dev` ou outros processos de longa duração para acompanhá-los.
- Não escreva scripts ad hoc para testes no navegador. A issue #19 prevê os testes E2E do projeto.
- Deixe `pnpm build` a cargo do CI.
- Consulte apenas os trechos de arquivo necessários para a tarefa. Reuse o resultado de uma checagem que já passou enquanto os arquivos e as condições relevantes estiverem iguais.

## Comando "next issue"

Quando a mensagem for **"next issue"** (ou "próxima issue"), siga os passos abaixo. Quando a mensagem já informar o número (`issue N`), use a issue indicada, pule os passos 1 e 2 e leia a issue inteira antes de codar.

0. **Sincronize o repositório local** antes de qualquer coisa:
   - Se `git status` mostrar alterações não commitadas, **pare** e pergunte o que fazer com elas.
   - `git switch main && git pull --ff-only && git fetch --prune`
   - Apague os branches locais cujo branch remoto já foi removido (PRs mesclados):
     `git branch -vv | grep ': gone]' | awk '{print $1}' | xargs -r git branch -D`
1. Liste as issues abertas do repositório pela API pública do GitHub:
   `curl -s "https://api.github.com/repos/patrickt26/classroom-planner/issues?state=open&per_page=100"`
   (ignore itens com o campo `pull_request`, que são PRs).
2. Escolha a issue aberta de **menor número** que:
   - pertença ao milestone aberto mais antigo (hoje, o Marco 1);
   - tenha **todas** as issues da seção "Depende de" já fechadas;
   - ainda não tenha um PR aberto que a mencione (`Closes #N`).
3. Antes de codar, responda em uma linha qual issue vai resolver e por quê.
   Se a issue tiver a etiqueta **`modelo-forte`**, **pare** antes de codar e avise: "Esta issue pede GPT-6.2 Astra com raciocínio High. Troque o modelo e mande `next issue` de novo." Siga só se a pessoa confirmar que já está nesse modelo.
4. Crie um branch a partir da `main` atualizada, no formato `<tipo>/<N>-<resumo>` (ex.: `chore/2-supabase-local`).
5. Resolva a issue seguindo todas as regras deste arquivo e abra o PR com `Closes #N`.

Se não conseguir acessar a API do GitHub, ou se nenhuma issue cumprir os critérios, **não adivinhe**: pare e peça o número da issue.

## Pull requests

- Título: `<tipo>: <resumo>` (tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- Corpo: preencha **todas** as seções do template (`.github/pull_request_template.md`): **O quê**, **Onde**, **Por quê**, **Como testar**.
- O "Por quê" explica a decisão e as alternativas descartadas, em linguagem que alguém aprendendo a stack entenda.
- Inclua `Closes #<número>` para fechar a issue.
- Depois de abrir o PR, encerre a tarefa. A revisão confere o CI. Não acompanhe nem espere o resultado do CI.
- Decisão de arquitetura nova (biblioteca, padrão, mudança de modelo)? Crie um ADR em `docs/decisions/` no mesmo PR.

## Documentação de referência

- Decisões e seus motivos: `docs/decisions/`.
- Escopo e critérios de cada tarefa: a issue correspondente.
- Modelo de dados: as migrações em `supabase/migrations/` são a fonte da verdade.
