# 0018 · Exclusão dos dados de um aluno arquivado

A professora executa o pedido do responsável em uma transação. A função `erase_student_data(uuid, uuid)` verifica o papel no espaço e bloqueia a linha do aluno antes de conferir o arquivamento e o nome. A ação envia o SHA-256 dos bytes UTF-8 do nome digitado no cabeçalho `x-student-name-sha256` da chamada PostgREST. Assim, o banco também recusa confirmações ausentes ou desatualizadas. Uma repetição após a exclusão devolve contagens zeradas.

A linha arquivada recebe o nome “Aluno removido”. A anonimização libera a remoção do último vínculo com responsável e encerra as edições no cadastro. Removemos os dados pedagógicos e preservamos um contato compartilhado enquanto houver outro aluno vinculado. A função informa quantas linhas removeu ou limpou em cada tabela alterada.

As aulas cobradas sustentam as chaves estrangeiras do financeiro. Mantemos essas aulas, as cobranças, os pagamentos e o histórico de tarifas (`student_rate_history`), que contém datas e valores e explica a tarifa aplicada. Removemos os links de reunião, as observações dos pagamentos e os vínculos de recorrência e remarcação das aulas retidas. Os valores e as datas dos lançamentos continuam disponíveis para cumprimento de obrigação legal. O prazo de retenção será validado com assessoria jurídica após o piloto.
