# 0013. Calendário nos campos de data

- **Status** Aceita
- **Data** 2026-11-23

## Contexto

O calendário nativo dos campos de data varia entre navegadores. A professora precisa identificar o início da semana e os fins de semana em todos os formulários.

## Decisão

Usar o React DayPicker v9 para a grade e a navegação do calendário, com o diálogo Radix já usado no projeto para gerenciar abertura, fechamento e foco. O componente compartilhado usa português do Brasil, começa na segunda-feira e destaca sábado e domingo. A data também pode ser digitada em `DD/MM/AAAA` e os formulários enviam o valor em `AAAA-MM-DD`, como as ações de servidor esperam. [Documentação do React DayPicker](https://daypicker.dev/v9)

## Alternativas consideradas

Manter `input[type="date"]` deixaria a apresentação do calendário sob controle de cada navegador. Implementar a grade sem biblioteca exigiria manter as regras de foco e navegação por teclado, inclusive nas transições de mês e ano.

## Consequências

Os formulários compartilham a mesma aparência, o mesmo formato de exibição e a mesma interação. O React DayPicker passa a fazer parte das dependências do projeto.
