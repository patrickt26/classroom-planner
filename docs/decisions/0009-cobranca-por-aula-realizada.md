# 0009. Cobrança por aula realizada

- **Status** Aceita
- **Data** 2026-11-22

## Contexto

A professora pode marcar uma aula como realizada pela agenda ou ao salvar o registro pós-aula. Ela também pode registrar hoje uma aula de um dia anterior ao último reajuste.

## Decisão

Um gatilho no Postgres gera a cobrança na mesma transação que marca a aula como realizada. A chave primária combina workspace e aula. A cobrança guarda a tarifa aplicada e a duração em minutos. O banco multiplica esses valores, divide por 60 e arredonda uma vez para o centavo mais próximo. Meio centavo arredonda para cima.

A vigência da tarifa segue o calendário do workspace. No primeiro reajuste de cada dia, o banco guarda o valor anterior, inclusive zero para gratuidade. Assim, um registro tardio consegue recuperar a tarifa da data da aula. Para datas anteriores ao início desse histórico, a única referência disponível é a tarifa que o aluno tinha na implantação. A migração começa a cobrar nas próximas marcações de aula realizada. As aulas já concluídas ficam sem lançamento retroativo automático.

## Alternativas consideradas

Gerar a cobrança em uma Server Action exigiria que a agenda e o registro pós-aula coordenassem separadamente a gravação de situação e valor. Uma falha entre as duas gravações poderia deixar uma aula realizada sem cobrança. Calcular o valor ao consultar o saldo faria um reajuste de tarifa alterar o total de aulas já cobradas.

## Consequências

Reajustes preservam os valores emitidos. Corrigir a duração de uma aula realizada usa a tarifa que a cobrança pendente já guardava. Corrigir o aluno ou o dia considera a tarifa correspondente ao novo aluno e à nova data. Desfazer a realização remove a pendência. Uma cobrança vinculada a pagamento conserva o valor e o vínculo com a aula, inclusive se a professora desfizer e refizer a marcação.
