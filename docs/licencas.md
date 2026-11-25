# Licenças de dependências, fontes e ícones

## Conferência de 25/11/2026

Levantamento feito na `main`, em Windows x64 com Node.js 24. Para refazer a conferência, instale as dependências com o lockfile e execute na raiz do repositório. [Documentação do pnpm](https://pnpm.io/cli/licenses)

```sh
pnpm install --frozen-lockfile
pnpm licenses list --prod --json
pnpm licenses list --dev --json
```

Cada coluna conta nomes de pacotes por licença. Duas versões com o mesmo nome e a mesma licença contam uma vez. Um nome pode aparecer em mais de uma licença ou nas duas colunas. A listagem inclui apenas os binários da plataforma em que foi executada. Para atualizar o levantamento, confira também o `pnpm-lock.yaml` e repita os comandos no Linux x64 usado no deploy e no CI.

| Licença declarada | Produção | Desenvolvimento |
| --- | ---: | ---: |
| MIT | 138 | 210 |
| Apache-2.0 | 5 | 9 |
| ISC | 6 | 11 |
| BSD-3-Clause | 1 | 6 |
| BSD-2-Clause | 0 | 4 |
| BlueOak-1.0.0 | 0 | 3 |
| 0BSD | 1 | 1 |
| CC-BY-4.0 | 1 | 1 |
| MPL-2.0 | 0 | 1 |
| Apache-2.0 AND LGPL-3.0-or-later | 1 | 0 |
| MIT OR Apache-2.0 | 0 | 1 |
| MIT OR CC0-1.0 | 0 | 1 |

As duas listagens não identificaram pacotes declarados sob GPL, AGPL ou SSPL, nem pacotes com licença desconhecida ou ausente. Os pacotes com LGPL estão detalhados abaixo.

## Sharp e libvips (LGPL)

O `sharp@0.35.5` (Apache-2.0) é uma dependência opcional do Next.js para otimizar imagens no servidor. O aplicativo não importa `next/image` em `src`. Os binários são de uso no servidor e não são enviados ao navegador. A integração usa a libvips como biblioteca separada, sem modificações pelo projeto. [Instalação do Sharp](https://sharp.pixelplumbing.com/install/)

| Plataforma | Pacote | Licença declarada |
| --- | --- | --- |
| Windows x64 | `@img/sharp-win32-x64@0.35.5` | Apache-2.0 AND LGPL-3.0-or-later |
| Linux x64 | `@img/sharp-linux-x64@0.35.5` | Apache-2.0 |
| Linux x64 | `@img/sharp-libvips-linux-x64@1.3.4` | LGPL-3.0-or-later |

A LGPL cobre a libvips incluída nesses binários. O pacote Linux da libvips tem outras bibliotecas nativas, com licenças discriminadas na documentação do pacote. [Pacote oficial da libvips para Sharp no Linux x64](https://www.npmjs.com/package/@img/sharp-libvips-linux-x64?activeTab=dependencies)

O acesso ao app hospedado não entrega uma cópia desses binários a quem usa o navegador. Ao redistribuir a biblioteca em forma binária, por exemplo, em uma imagem de contêiner distribuída a terceiros, é preciso preservar os avisos, incluir os textos da LGPL e da GPLv3 e disponibilizar o código-fonte correspondente da parte coberta, incluindo eventuais modificações. Ao distribuir a aplicação combinada com a biblioteca, a seção 4 também exige permitir o uso de uma versão modificada e compatível da biblioteca, seja por um mecanismo adequado de ligação dinâmica, seja fornecendo o necessário para refazer a ligação. Ela protege ainda a engenharia reversa para depurar essas modificações. Essas condições permitem manter o código do app sob sua própria licença. [Texto da LGPL-3.0-or-later](https://spdx.org/licenses/LGPL-3.0-or-later.html)

Uma alternativa para as imagens estáticas do app é servi-las diretamente, sem usar o otimizador do Next.js. Isso evita o uso do Sharp para essas imagens. A instalação do pacote ainda depende de como as dependências opcionais do Next.js são instaladas. [Documentação do otimizador de imagens do Next.js](https://nextjs.org/docs/app/api-reference/components/image#unoptimized)

## Outras licenças que exigem atenção

- **MPL-2.0** — `lightningcss@1.33.0` e `lightningcss-linux-x64-gnu@1.33.0` são usados no desenvolvimento e no build, via Tailwind e Vite. O binário Linux está no lockfile e fica fora da contagem do Windows. Se houver redistribuição do executável, é preciso preservar os avisos e indicar como obter o fonte dos arquivos cobertos, inclusive eventuais modificações nesses arquivos. [Mozilla Public License 2.0, seção 3](https://www.mozilla.org/en-US/MPL/2.0/#responsibilities)
- **CC-BY-4.0** — `caniuse-lite@1.0.30001826` aparece nas duas listas. Ao redistribuir a base de dados, é preciso dar o crédito apropriado, indicar a licença e informar se houve alterações. [Creative Commons Attribution 4.0, seção 3](https://creativecommons.org/licenses/by/4.0/legalcode#s3)

## Fonte, ícones e outros materiais

- **Arimo** — SIL Open Font License 1.1 (OFL-1.1), conferida no repositório oficial do Google Fonts. O app carrega a fonte com `next/font/google`. A licença permite a distribuição junto com o software com o aviso de direitos autorais e o texto da licença preservados. [Licença oficial da Arimo](https://github.com/google/fonts/blob/main/ofl/arimo/OFL.txt)
- **Lucide** — `lucide-react` declara ISC. A licença oficial também identifica os ícones derivados de Feather, que estão sob MIT. Ambas exigem a preservação dos avisos aplicáveis ao redistribuir cópias. [Licença oficial do Lucide e dos ícones derivados de Feather](https://github.com/lucide-icons/lucide/blob/main/LICENSE)

Além da fonte e da biblioteca de ícones acima, a revisão do código não identificou logos, imagens ou textos atribuídos a terceiros na interface. Os ícones locais `src/app/icon.svg` e `src/app/apple-icon.png` mostram o mesmo calendário com um visto, nas cores do app. O SVG é composto de formas desenhadas no próprio arquivo, sem referências externas. O histórico registra a inclusão dos dois arquivos no PR #108, mas não documenta a autoria do desenho.
