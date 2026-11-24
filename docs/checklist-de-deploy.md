# Checklist de deploy do Marco 1

Use este roteiro ao publicar a versão aprovada. Registre a revisão publicada e o resultado de cada verificação. As caixas começam abertas.

## Banco de produção

- [ ] Criar um projeto Supabase em São Paulo (`sa-east-1`). Confirmar no painel a referência do projeto de produção.
- [ ] Com a CLI do repositório autenticada, substituir `<ref>` pela referência conferida e executar `pnpm exec supabase db push --remote=<ref> --dry-run`. Conferir as migrações previstas em `supabase/migrations/`. Executar `pnpm exec supabase db push --remote=<ref>` para aplicá-las. O seed é exclusivo de desenvolvimento e CI. O comando de produção deve omitir `--include-seed`. [Migrações entre ambientes](https://supabase.com/docs/guides/deployment/managing-environments)
- [ ] Antes do primeiro convite, verificar no painel que a conta do seed (`professora.exemplo@example.test`) está ausente e que a tabela `public.students` está vazia.
- [ ] No SQL Editor do projeto de produção, executar a consulta abaixo. Conferir que as tabelas das migrações aparecem, todas com `rls_ativa = true` e políticas explícitas. Revisar as políticas de leitura e escrita no painel e confirmar o isolamento por workspace. A consulta usa apenas metadados.

```sql
select t.tablename, t.rowsecurity as rls_ativa, count(p.policyname) as politicas
from pg_catalog.pg_tables as t
left join pg_catalog.pg_policies as p
  on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename, t.rowsecurity
order by t.tablename;
```

- [ ] Rodar os Advisors de segurança e desempenho depois das migrações, corrigir os achados e repetir a verificação.

## Vercel

- [ ] Importar o repositório como projeto Next.js. Selecionar Node.js 24, o pnpm definido em `package.json`, build `pnpm build` e região das funções São Paulo (`gru1`). Identificar a origem HTTPS definitiva da aplicação. [Região das funções](https://vercel.com/docs/functions/configuring-functions/region)
- [ ] Configurar estas variáveis no ambiente **Production**, antes do build. Refazer o deploy após alterar qualquer valor público.

| Variável | Valor em produção |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API do projeto Supabase de produção |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável desse projeto |
| `NEXT_PUBLIC_SIGNUP_ENABLED` | `false` |
| `NEXT_PUBLIC_SITE_URL` | Origem HTTPS definitiva da aplicação |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Caixa de contato para o botão “Pedir convite” e as páginas públicas |

As chaves administrativas do Supabase e as credenciais SMTP ficam fora das variáveis públicas. A chave usada pelo Playwright pertence ao Supabase descartável do teste.

## Supabase Auth e e-mail

- [ ] Em URL Configuration, definir **Site URL** como a origem HTTPS da aplicação, sem barra final. Em **Redirect URLs**, cadastrar a URL exata dessa origem seguida de `/confirmar`.
- [ ] Desativar **Allow new users to sign up** (`enable_signup = false`). Manter login por e-mail e senha habilitado, exigir senha mínima de oito caracteres e conferir os limites de tentativas de login e de envio de e-mails. O captcha é opcional para este piloto por convite.
- [ ] Em **Authentication → Email Templates**, colar o HTML completo e preencher o assunto de cada template conforme a tabela abaixo. Salvar os três templates. Preservar as variáveis, o token e o tipo de cada link. O convite usa a Site URL porque o envio pelo painel pode ocorrer sem uma URL de retorno. [Templates do Supabase Auth](https://supabase.com/docs/guides/auth/auth-email-templates)

| Template no painel | Arquivo em `supabase/templates/` | Assunto |
| --- | --- | --- |
| Invite user | `invite.html` | Seu convite para o Classroom Planner |
| Confirm signup | `confirmation.html` | Confirme seu e-mail no Classroom Planner |
| Reset password | `recovery.html` | Redefinir sua senha do Classroom Planner |

- [ ] Validar o remetente em Brevo ou Resend. Em **Custom SMTP** do Supabase, preencher remetente, host, porta, usuário e senha SMTP fornecidos pelo provedor. Desativar rastreamento de cliques nesses e-mails para preservar o link de uso único. [SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp)

Um remetente `@gmail.com` via Brevo tende a cair na aba Promoções do Gmail. Para melhorar a entregabilidade, use um domínio próprio com SPF, DKIM e DMARC quando essa infraestrutura estiver disponível. [Autenticação de domínio na Brevo](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)

## Verificação na URL publicada

- [ ] Publicar a revisão aprovada e confirmar a região das funções no deployment. Abrir `/entrar`, conferir que “Criar conta” está oculto e verificar o status HTTP 404 em `/criar-conta`, `/tema` e `/tema/alunos`.
- [ ] Em **Authentication → Users → Invite user**, convidar uma caixa controlada pela equipe. Abrir o e-mail em uma janela privativa. O link deve passar por `/confirmar`, abrir `/nova-senha` e permitir salvar uma senha. Sair e entrar novamente com ela. Conferir que a tela **Hoje** abre no workspace da convidada. Esse convite confirma a conta no piloto.
- [ ] Em `/recuperar-senha`, solicitar um link para a mesma caixa, recebê-lo via SMTP e definir outra senha. Entrar novamente em uma janela privativa.
- [ ] Em `/robots.txt` e `/sitemap.xml`, conferir a origem publicada. Abrir `/privacidade`, `/termos` e o botão “Pedir convite” e conferir o destino do contato.
- [ ] Conferir no GitHub que o secret scanning e a push protection estão ativos.

## Como reproduzir os E2E em ambiente descartável

O job **Aplicação** inicia o Supabase local com as migrações e o seed, compila o app com a chave pública local e usa Chromium no build de produção. O teste do convite lê a mensagem que o Auth entregou ao Mailpit local.

1. Com Docker disponível, executar `pnpm install --frozen-lockfile` e `pnpm exec supabase start` em um ambiente local descartável. Usar uma instância iniciada com o `supabase/config.toml` desta revisão, inclusive o template de convite.
2. Em `.env.local`, preencher a URL e a chave publicável locais conforme o README e definir `NEXT_PUBLIC_SIGNUP_ENABLED=false`. Exportar no terminal `E2E_SUPABASE_SECRET_KEY` com a `SECRET_KEY` do comando `pnpm exec supabase status -o json`. Essa chave só serve para o runner solicitar o convite ao Auth local.
3. Executar `pnpm build`, `pnpm exec playwright install chromium` e `pnpm test:e2e`. Deixar a porta 3000 livre para o servidor iniciado e encerrado pelo Playwright. Os testes cadastram usuários e dados fictícios nessa instância.
