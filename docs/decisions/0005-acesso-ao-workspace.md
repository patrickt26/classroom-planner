# 0005 · Criação e acesso ao espaço da professora

O cadastro público cria contas de professoras. Um trigger em `auth.users` cria o espaço e o primeiro vínculo na mesma transação do cadastro. Uma falha desfaz a operação inteira. Fazer as duas gravações pela aplicação exigiria recuperar cadastros incompletos e conceder ao cliente permissão para criar vínculos.

Cada pessoa pode consultar seus próprios vínculos. As funções de autorização consultam esses vínculos com as permissões de quem fez a requisição. A aplicação usa a chave pública e a sessão da professora para ler e editar o espaço. O banco restringe a edição às colunas de nome e marca. O fluxo de convites precisará definir o provisionamento das contas de alunos e responsáveis quando for implementado.

Os e-mails de confirmação e recuperação apontam para a rota /confirmar na origem autorizada do aplicativo. O servidor troca o token de uso único por uma sessão em cookie. Isso permite abrir o e-mail em outro navegador. Ao configurar um ambiente hospedado, registre a URL de redirecionamento do ambiente e aplique os modelos de e-mail de `supabase/templates/` no Supabase Auth.
