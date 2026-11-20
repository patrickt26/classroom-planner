# 0001. Next.js + Supabase como stack do MVP

- **Status:** aceita
- **Data:** 2026-11-20

## Contexto
O MVP atende uma professora com poucos alunos, usado principalmente no celular, e precisa custar zero
enquanto valida o produto. O desenvolvimento é feito por uma pessoa com apoio de agentes de código.
Os dados envolvem menores, então isolamento e controle de acesso precisam ser fortes desde o início.

## Decisão
Next.js (App Router, TypeScript) hospedado na Vercel, com as regras de negócio em Server Actions,
e Supabase completo: Postgres, Auth, Row Level Security, Storage e `pg_cron`.

## Alternativas consideradas
- **API própria em NestJS + PostgreSQL:** mais controle e aprendizado de backend, mas exigiria três
  hospedagens, autenticação e filas construídas do zero e, no plano gratuito, uma API que "dorme" e demora
  a responder. Grande demais para o tamanho do projeto agora.
- **Firebase:** simples de começar, mas o modelo NoSQL dificulta histórico, relatórios e relacionamentos.

## Consequências
- Login, permissões (RLS), arquivos e agendamento vêm prontos; menos código para manter.
- O isolamento por professora é garantido pelo banco, não só pelo código.
- Se o projeto crescer (app móvel, integrações), uma API separada pode ser extraída depois sem mudar o banco.
- Limites do plano gratuito do Supabase: 2 projetos ativos por conta, pausa após 7 dias sem uso, 1 GB de Storage.
- O plano Hobby da Vercel é para uso não comercial; reavaliar a hospedagem do front após o MVP.
