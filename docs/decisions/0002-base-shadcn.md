# 0002. Inicialização do shadcn/ui

- **Status:** aceita

## Contexto

O shadcn/ui fornece componentes que passam a fazer parte do código do projeto. O CLI
precisa de uma configuração para saber qual registro usar e em quais pastas gerar esses arquivos.

## Decisão

Usar o preset Nova com primitivas Radix. O CLI registra essa escolha em
`components.json` e aponta os componentes gerados para `src/components/ui`.
Os estilos compartilhados entram no CSS global pelo Tailwind 4.

## Alternativas consideradas

O preset Nova também está disponível com Base UI. Escolhemos Radix para acompanhar
os exemplos do registro Radix do shadcn e manter uma única base para os componentes.
Configurar tudo manualmente também seria possível, mas a inicialização pelo CLI entrega
os aliases e as dependências do preset em conjunto.

## Consequências

Os próximos componentes devem ser adicionados com a configuração existente. Os tokens
gerados servem de ponto de partida para a identidade visual da issue #4.
