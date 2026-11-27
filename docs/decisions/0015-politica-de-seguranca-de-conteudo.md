# 0015. Política de segurança de conteúdo

- **Status** Aceita
- **Data** 2026-11-23

O Next.js inclui scripts no HTML para ativar a interface, os formulários e a navegação. Liberar qualquer script inline permitiria executar também código injetado na página.

O proxy gera um nonce aleatório de 128 bits por requisição. Ele encaminha a política ao Next.js, que marca seus scripts com esse nonce, e envia a mesma política ao navegador. O layout raiz usa renderização dinâmica para que o HTML do login e das demais páginas corresponda ao cabeçalho daquela requisição. Isso abre mão do cache compartilhado de HTML. Arquivos estáticos continuam com cache e recebem a política global, que bloqueia a execução de scripts quando o arquivo é aberto como documento. [Guia de CSP do Next.js](https://nextjs.org/docs/app/guides/content-security-policy)

A política permite conexões à própria aplicação e à origem configurada do Supabase, incluindo seu WebSocket. O modo de desenvolvimento permite `unsafe-eval` para a depuração do React. Estilos inline continuam disponíveis para os componentes Radix, que posicionam elementos e inserem estilos em tempo de execução.

Quando a chave pública do Turnstile está configurada, `frame-src` permite os iframes de `https://challenges.cloudflare.com` nas respostas com nonce. Os formulários de login, recuperação e cadastro carregam o script oficial com o nonce encaminhado pelo proxy. Com `strict-dynamic`, a confiança é propagada aos scripts carregados pelo Turnstile. A integração usa as regras existentes de `connect-src` e mantém scripts inline limitados ao nonce. [CSP do Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/reference/content-security-policy/)
