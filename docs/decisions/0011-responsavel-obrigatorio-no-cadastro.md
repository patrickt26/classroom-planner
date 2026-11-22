# 0011 — Responsável obrigatório no cadastro do aluno

A professora pode cadastrar um contato ou escolher um contato do seu espaço ao criar um aluno. A edição da ficha continua independente dos dados do responsável.

A RPC `save_student` grava aluno, vínculo e disciplinas na mesma transação. Ela usa as funções existentes de cadastro e vínculo de responsáveis, com a autorização do workspace aplicada pelas políticas de RLS. Chamadas separadas da aplicação poderiam deixar um aluno sem responsável se o vínculo falhasse após a gravação do aluno.

Uma restrição adiada até o fim da transação também protege inserções feitas diretamente no banco. Isso permite que o seed grave primeiro os alunos e depois os vínculos. Na remoção, o banco serializa alterações pelo registro do aluno antes de verificar se ainda existe um vínculo. Assim, duas remoções concorrentes também respeitam a regra. Exclusões em cascata do próprio aluno ou workspace continuam possíveis.

A migração preserva alunos já cadastrados. Alunos antigos sem responsável podem receber um vínculo pela ficha.
