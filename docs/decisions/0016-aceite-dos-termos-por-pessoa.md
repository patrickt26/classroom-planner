# 0016 · Aceite dos termos por pessoa e versão

O aceite acompanha a conta, inclusive quando a pessoa muda de espaço. Por isso, `public.terms_acceptances` usa `user_id` como vínculo com `auth.users`, uma exceção à regra de incluir `workspace_id` em tabelas com dados pessoais. Vincular o aceite ao espaço duplicaria o registro para quem participa de mais de um.

Cada versão aceita gera uma linha com a data e a hora do banco. A RLS restringe a leitura e a inserção à própria pessoa. As permissões preservam o histórico e a exclusão da conta remove seus aceites por cascata.
