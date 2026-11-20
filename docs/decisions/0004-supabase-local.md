# 0004. Supabase local com CLI versionada e clientes SSR

- **Status:** aceita
- **Data:** 2026-11-20

## Contexto

O projeto precisa aplicar migrações, gerar tipos e testar o Postgres sem depender
de um banco hospedado ou de dados reais. O App Router usa cookies para compartilhar
a sessão do Supabase entre o navegador e o servidor.

## Decisão

Fixar a versão da Supabase CLI nas dependências de desenvolvimento e usar o
Supabase local com Docker para aplicar migrações, rodar pgTAP e gerar os tipos
do schema `public`. Usar `@supabase/ssr` e `@supabase/supabase-js` como clientes
oficiais, com adaptadores de cookies para cada contexto do Next.js e a chave
publicável do projeto. [Guia de SSR do Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework&router=app)

## Alternativas consideradas

- **CLI global:** exige uma instalação separada e pode gerar resultados diferentes
  quando cada ambiente usa uma versão da CLI.
- **Banco hospedado para desenvolvimento:** exige acesso remoto e compartilha
  estado entre execuções de migrações e testes.
- **Gerenciar cookies diretamente com `@supabase/supabase-js`:** duplicaria a lógica
  de sessão e renovação já mantida no pacote SSR oficial.

## Consequências

O lockfile fixa a ferramenta usada pela equipe para reproduzir o schema e os tipos.
O fluxo exige Docker para iniciar o banco e os serviços locais. A integração do
adaptador de renovação de sessão ao Proxy do Next.js fica para a issue de login.
