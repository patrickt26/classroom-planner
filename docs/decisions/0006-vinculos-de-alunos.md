# 0006 · Vínculos de alunos por workspace

As chaves de alunos, responsáveis, anos e disciplinas combinam `workspace_id` e `id`. Cada referência inclui os dois campos. Assim, o próprio Postgres exige que o aluno e a disciplina, o ano ou o responsável pertençam ao mesmo espaço. Usar apenas o ID na referência exigiria verificar essa condição a cada gravação, inclusive em importações.

A RLS permite à professora gerenciar os registros do seu workspace. A edição de um aluno preserva seu identificador e permite arquivar ou reativar o cadastro por `archived_at`. A professora pode vincular vários responsáveis ao aluno e indicar um deles para as cobranças. Um índice único parcial preserva essa regra mesmo em edições simultâneas.

O valor por hora usa centavos inteiros. Alunos pagantes têm valor positivo e alunos gratuitos têm `is_free` marcado e valor zero. O banco e a validação de entrada aplicam a mesma regra.
