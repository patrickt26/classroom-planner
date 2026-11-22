# 0010. Registro e estorno de pagamentos

- **Status** Aceita
- **Data** 2026-11-22

## Contexto

Uma professora pode receber várias aulas de um aluno de uma vez. Duas sessões podem tentar quitar a mesma aula ao mesmo tempo.

## Decisão

O Postgres registra o pagamento e vincula as cobranças em uma única transação. A função confere o papel da professora e bloqueia as cobranças selecionadas em ordem de identificador. Quando todas continuam pendentes para aquele aluno, soma os valores em centavos e grava o pagamento. A chave estrangeira composta mantém aluno, pagamento e cobranças no mesmo espaço.

O estorno registra sua data no histórico e libera as cobranças na mesma transação. O resumo mensal considera a data do pagamento para recebimentos e a data local da aula para pendências. Um estorno retira o pagamento do recebido e devolve cada pendência ao mês da aula.

## Alternativas consideradas

Calcular o valor no navegador e gravar o pagamento e as cobranças em requisições separadas deixaria espaço para divergência de valores ou quitação incompleta. Excluir o pagamento no estorno apagaria o histórico que permite à professora conferir o movimento.
