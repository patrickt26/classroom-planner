# 0017 · Registro da autorização do responsável

A confirmação integra a transação de cadastro definida nos ADRs 0007 e 0011. O banco exige o booleano verdadeiro para criar o aluno e preenche a data com seu próprio relógio. Uma data padrão na tabela também marcaria como autorizada uma inserção sem confirmação.

A criação passa exclusivamente pela função `save_student` para clientes autenticados. Essa função e `record_guardian_consent` usam `security definer`, verificam o papel de professora no workspace e limitam cada escrita ao espaço informado. Os privilégios de atualização por coluna permitem editar o cadastro e reservam a gravação da data às funções.

A migração mantém a data nula nos cadastros antigos. Registrar a autorização pela ficha preenche apenas uma data ausente, preservando o primeiro registro mesmo com cliques simultâneos.
