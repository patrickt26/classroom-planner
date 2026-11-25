# Checklist de deploy do Marco 1

Use este roteiro ao publicar a versão aprovada. As caixas marcadas registram as etapas confirmadas no lançamento do Marco 1.

Se houver suspeita de exposição de dados durante ou após a publicação, siga o [roteiro de resposta a incidentes](incidente-de-dados.md).

## Banco de produção

- [ ] Criar um projeto Supabase em São Paulo (`sa-east-1`). Confirmar no painel a referência do projeto de produção.
- [x] Migrações aplicadas em produção sem o seed. Para futuras migrações, conferir a referência do projeto e as migrações previstas com `pnpm exec supabase db push --remote=<ref> --dry-run` antes de executar `pnpm exec supabase db push --remote=<ref>`. O seed é exclusivo de desenvolvimento e CI. [Migrações entre ambientes](https://supabase.com/docs/guides/deployment/managing-environments)
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

- [x] Aplicação publicada na URL de produção (consultar o painel da Vercel), com funções em São Paulo (`gru1`).
- [ ] Conferir Node.js 26, o pnpm definido em `package.json` e o comando de build `pnpm build` no projeto Next.js.
- [ ] Configurar estas variáveis no ambiente **Production**, antes do build. Refazer o deploy após alterar qualquer valor público.

| Variável | Valor em produção |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API do projeto Supabase de produção |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável desse projeto |
| `NEXT_PUBLIC_SIGNUP_ENABLED` | `false` |
| `NEXT_PUBLIC_SITE_URL` | Origem HTTPS definitiva da aplicação |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Caixa de contato para o botão “Pedir convite” e as páginas públicas |
| `NEXT_PUBLIC_PRIVACY_OFFICER_NAME` | Nome do encarregado exibido na política de privacidade |

As chaves administrativas do Supabase e as credenciais SMTP ficam fora das variáveis públicas. A chave usada pelo Playwright pertence ao Supabase descartável do teste.

## Supabase Auth e e-mail

- [ ] Em URL Configuration, definir **Site URL** como a origem HTTPS da aplicação, sem barra final. Em **Redirect URLs**, cadastrar a URL exata dessa origem seguida de `/confirmar`.
- [x] Cadastro aberto desativado em produção. O acesso ao piloto é por convite.
- [ ] Conferir senha mínima de oito caracteres e os limites de tentativas de login e de envio de e-mails. O captcha é opcional para este piloto por convite.
- [x] Templates colados em **Authentication → Email Templates** conforme a tabela abaixo. Preservar as variáveis, o token e o tipo de cada link ao atualizar os modelos. O convite usa a Site URL porque o envio pelo painel pode ocorrer sem uma URL de retorno. [Templates do Supabase Auth](https://supabase.com/docs/guides/auth/auth-email-templates)

| Template no painel | Arquivo em `supabase/templates/` | Assunto |
| --- | --- | --- |
| Invite user | `invite.html` | Seu convite para o Classroom Planner |
| Confirm signup | `confirmation.html` | Confirme seu e-mail no Classroom Planner |
| Reset password | `recovery.html` | Redefinir sua senha do Classroom Planner |

- [x] Brevo configurado em **Custom SMTP** do Supabase. [SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp)

## Verificação na URL publicada

- [ ] Abrir `/entrar`, conferir que “Criar conta” está oculto e verificar o status HTTP 404 em `/criar-conta`, `/tema` e `/tema/alunos`.
- [x] Convite testado em produção. Para repetir, enviar o convite em **Authentication → Users → Invite user** para uma caixa controlada pela equipe. Abrir o link em janela privativa, definir a senha e entrar novamente. Conferir que a tela **Hoje** abre no workspace da convidada.
- [x] Recuperação de senha testada em produção. Para repetir, solicitar o link por `/recuperar-senha`, abrir a mensagem entregue pelo SMTP, definir outra senha e entrar novamente em janela privativa.
- [ ] Em `/robots.txt` e `/sitemap.xml`, conferir a origem publicada. Conferir os links e o contato no rodapé de `/`, `/privacidade` e `/termos`, o nome do encarregado na política e o destino do botão “Pedir convite”.
- [ ] Conferir no GitHub que o secret scanning e a push protection estão ativos.

## Pendências após o lançamento

- [ ] Configurar domínio próprio com SPF, DKIM e DMARC para melhorar a entregabilidade. Os e-mails estão chegando à aba Promoções do Gmail. [Autenticação de domínio na Brevo](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [ ] Reavaliar como desativar o rastreamento de cliques nos e-mails de autenticação. O plano Brevo Free em uso não permite desativá-lo.
- [x] Atualizações de versão principal do Dependabot resolvidas. Os PRs #107 e #106 foram mesclados, e o PR #105 foi substituído pela atualização para o Node.js 26 (#116 e #124).

## Como reproduzir os E2E em ambiente descartável

O job **Aplicação** inicia o Supabase local com as migrações e o seed, compila o app com a chave pública local e usa Chromium no build de produção. O teste do convite lê a mensagem que o Auth entregou ao Mailpit local.

1. Com Docker disponível, executar `pnpm install --frozen-lockfile` e `pnpm exec supabase start` em um ambiente local descartável. Usar uma instância iniciada com o `supabase/config.toml` desta revisão, inclusive o template de convite.
2. Em `.env.local`, preencher a URL e a chave publicável locais conforme o README e definir `NEXT_PUBLIC_SIGNUP_ENABLED=false`. Exportar no terminal `E2E_SUPABASE_SECRET_KEY` com a `SECRET_KEY` do comando `pnpm exec supabase status -o json`. Essa chave só serve para o runner solicitar o convite ao Auth local.
3. Executar `pnpm build`, `pnpm exec playwright install chromium` e `pnpm test:e2e`. Deixar a porta 3000 livre para o servidor iniciado e encerrado pelo Playwright. Os testes cadastram usuários e dados fictícios nessa instância.
