# classroom-planner

Plataforma web para professoras particulares do Ensino Fundamental organizarem o dia a dia, com interface pensada para o celular.

O Marco 1, **O dia a dia**, está concluído e o app está no ar. A versão **1.0.0** reúne essas entregas no [changelog](CHANGELOG.md).

## O que o app faz hoje

- **Acesso por convite.** Após definir a senha, a professora aceita os Termos de uso e a Política de privacidade para entrar no espaço. O app solicita novo aceite quando a versão muda. A data e a versão aceitas ficam em Configurações. A professora pode recuperar a senha por e-mail. Os e-mails de autenticação seguem a identidade visual do app.
- **Sessões.** Em **Configurações → Conta**, use **Sair de todos os aparelhos** para revogar todas as sessões. Ao redefinir a senha, o app encerra as outras sessões e mantém o acesso no aparelho usado para redefini-la. Nos outros aparelhos, um token de acesso já emitido pode continuar válido até expirar.
- **Hoje.** Veja as aulas do dia, abra o planejamento direto pelo cartão da aula e confira os registros, as reposições e as cobranças pendentes.
- **Alunos e responsáveis.** Confirme a autorização do responsável ao cadastrar um aluno. Na ficha, consulte a data da autorização, registre-a para alunos antigos e acompanhe o histórico de aulas. Você também pode buscar, editar e arquivar alunos e manter os vínculos com responsáveis.
- **Agenda.** Agende aulas avulsas ou semanais em vários dias, filtre por aluno, veja avisos de conflito de horários e agende reposições.
- **Planejamento e registro pós-aula.** Crie um plano ou copie de outra aula, consulte os próximos passos da última aula com registro e registre o que foi trabalhado, com histórico de edições.
- **Cobranças.** Aulas pagas por hora geram cobranças ao serem realizadas. Confira valores a receber, em atraso e recebidos no mês, registre pagamentos de uma ou várias aulas e faça estornos.
- **Configurações.** Ajuste o nome e a marca do espaço, escolha quando a semana começa e gerencie matérias e séries. Em **Seus dados**, baixe um JSON com os dados cadastrados e da conta ou consulte o contato para pedir a exclusão por e-mail.

A página inicial apresenta a plataforma. O rodapé da página inicial e das páginas públicas reúne o contato de privacidade e os links para a [Política de Privacidade](src/app/(publico)/privacidade/page.tsx) e os [Termos de Uso](src/app/(publico)/termos/page.tsx).

## Stack

- **Aplicação:** Node.js 26, Next.js 16 (App Router), React 19 e TypeScript 7.
- **Interface:** Tailwind CSS 4 e shadcn/ui.
- **Banco e autenticação:** Supabase (Postgres, Auth, isolamento por workspace com RLS e recorrências com `pg_cron`).
- **Qualidade:** Biome 2, Vitest 5, Playwright 1 e pgTAP.
- **Hospedagem:** Vercel.

As escolhas da stack estão documentadas no [ADR 0001](docs/decisions/0001-stack.md).

## Rodando localmente

Use Node.js 26 e a versão do pnpm indicada no campo `packageManager` do `package.json`. Se você usa um gerenciador de versões, o fnm pode selecionar o Node a partir de `engines.node`. [Documentação do fnm](https://github.com/Schniz/fnm/blob/master/docs/commands.md)

Com o Corepack instalado, use `corepack enable pnpm` ou substitua `pnpm` por `corepack pnpm` nos comandos. Com o Docker em execução, instale as dependências e inicie o Supabase local pela CLI do projeto.

```sh
pnpm install --frozen-lockfile
pnpm exec supabase start
pnpm exec supabase status
```

Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` com `API_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com `PUBLISHABLE_KEY` da instância local. Para exibir o contato de privacidade localmente, use um endereço fictício, como `privacidade@example.test`, em `NEXT_PUBLIC_CONTACT_EMAIL`. O Studio e o Analytics estão desativados na configuração local.

Para os e-mails de autenticação, mantenha `NEXT_PUBLIC_SITE_URL` alinhada com a **Site URL** do Supabase. O app usa `http://localhost:3000` por padrão no desenvolvimento. Fora do desenvolvimento, configure uma URL HTTPS para cadastro e recuperação de senha.

```sh
pnpm dev
```

Abra [localhost:3000](http://localhost:3000) para ver a apresentação do app. Em [Entrar](http://localhost:3000/entrar), use a conta fictícia do seed, `professora.exemplo@example.test`, com a senha local `senha-de-teste`.

### O que explorar com o seed

O seed cria as datas de exemplo em relação ao dia, à semana e ao mês em que é aplicado.

Para testar o primeiro acesso, entre com `primeiro.acesso@example.test` e a mesma senha fictícia. Essa conta começa com o aceite pendente. A conta principal já aceitou a versão vigente.

Para testar a saída de todos os aparelhos, entre com `professora.sessoes@example.test` e a mesma senha fictícia em duas sessões separadas.

- **Hoje:** aulas no dia da carga e pendências de registro, reposição e cobrança.
- **Alunos:** quatro fichas fictícias com responsáveis vinculados, incluindo um responsável compartilhado. A linha do tempo mostra exemplos de falta, reposição realizada e registro pós-aula. Abra o registro para consultar o histórico de edições.
- **Agenda:** aulas avulsas e recorrentes, presenciais e online, e uma reposição pendente. A semana anterior tem exemplos de aula realizada, cancelada e com falta, além de aulas com planejamento e registro.
- **Cobranças:** cobranças em aberto e pagamentos registrados, com exemplos no mês atual e no anterior.
- **Configurações:** espaço de exemplo com a semana começando na segunda-feira e catálogos com matérias e séries ativas e arquivadas.

### Testes ponta a ponta (E2E)

Use uma instância local descartável do Supabase com as migrações e o seed, o Mailpit ativo e as variáveis públicas locais descritas acima. A suíte cria dados fictícios e usa as portas padrão do Supabase (`54321`) e do Mailpit (`54324`).

Em `.env.local`, defina `NEXT_PUBLIC_SIGNUP_ENABLED=false` antes de compilar, para testar o acesso por convite. Obtenha `SECRET_KEY` com `pnpm exec supabase status -o json` e exporte-a no terminal como `E2E_SUPABASE_SECRET_KEY` apenas para o runner. Encerre o servidor de desenvolvimento antes de rodar a suíte para liberar a porta 3000.

```sh
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

O Playwright sobe e encerra o servidor do build de produção. A suíte cobre o convite por e-mail, o aceite inicial e de uma nova versão dos termos, o acesso com cadastro público fechado, o atalho de planejamento na tela Hoje, o fluxo de cadastro de aluno até o pagamento da aula e a exportação isolada dos dados de duas professoras fictícias.

### Migrações e tipos

Após criar uma migração, recrie o banco local, rode os testes pgTAP e regenere os tipos do schema `public`. O reset descarta os dados locais e reaplica o seed.

```sh
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm db:types
```

Versione a migração e o arquivo gerado `src/types/database.ts` juntos. Para encerrar o Supabase local, use `pnpm exec supabase stop`.

## Qualidade

O GitHub Actions roda lint e checagem de formatação (`pnpm lint`), tipos (`pnpm typecheck`), testes unitários (`pnpm test`), auditoria de dependências de produção (`pnpm audit --prod --audit-level=high`), build de produção e E2E no Chromium. O CI também roda pgTAP num banco local recriado e varre segredos com Gitleaks. Para aplicar a formatação localmente, use `pnpm format`.

## Marcos

1. **O dia a dia (1.0.0), concluído.** Alunos, agenda, planejamento, registro pós-aula, continuidade pedagógica e cobranças por aula.
2. **Biblioteca, próximo marco.** Materiais organizados e reutilizáveis.
3. **Assistente, planejado.** Apoio à produção de materiais com IA.
4. **Portal do aluno, planejado.** Materiais e atividades para alunos e responsáveis.

## Como o projeto é desenvolvido

O repositório é uma vitrine do projeto e de como ele é desenvolvido, do planejamento à publicação.

- Cada funcionalidade tem uma **issue** com contexto, escopo e critérios de aceite, organizada no GitHub Projects e em marcos.
- Cada issue vira **um PR pequeno** que explica o que mudou, onde, por quê e como testar. [Template de pull request](.github/pull_request_template.md)
- Quem contribui, incluindo agentes de código, segue as regras do [AGENTS.md](AGENTS.md).
- As decisões de arquitetura ficam registradas nos [ADRs](docs/decisions).
- Para reproduzir os testes ponta a ponta ou publicar uma versão, siga o [checklist de deploy](docs/checklist-de-deploy.md).
- Em caso de suspeita de exposição de dados, siga o [roteiro de resposta a incidentes](docs/incidente-de-dados.md).

## Licença

Todos os direitos reservados. O código está disponível publicamente apenas para consulta. Consulte o [aviso de direitos autorais](LICENSE) e a [conferência de licenças de terceiros](docs/licencas.md).
