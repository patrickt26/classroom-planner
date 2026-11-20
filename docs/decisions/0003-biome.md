# 0003. Biome para lint e formatação

- **Status:** aceita

## Contexto

A configuração inicial precisa verificar código e padronizar a formatação em qualquer ambiente.

## Decisão

Usar Biome com uma configuração única em `biome.json`. O comando `pnpm lint`
verifica lint e formatação. O comando `pnpm format` aplica a formatação.

## Alternativas consideradas

ESLint e Prettier oferecem configurações separadas para lint e formatação.
Biome reúne as verificações em um comando e usa as exclusões do Git para ignorar o
código gerado pelo Next.js.
