# 0007 · Gravação de alunos e disciplinas

O cadastro do aluno reúne dados de `students` e vínculos de `student_subjects`. A Server Action valida os campos com Zod e chama uma função do Postgres que grava as duas tabelas na mesma transação. A função roda com as permissões da professora, sujeita à RLS e às chaves estrangeiras por workspace.

Gravar em chamadas separadas pelo Supabase poderia atualizar os dados do aluno e deixar parte dos vínculos desatualizada se uma chamada falhasse. Com a transação, uma disciplina inválida desfaz toda a gravação. A atualização da linha do aluno também faz duas edições concorrentes do mesmo cadastro aguardarem uma pela outra antes de substituir os vínculos.
