# 0012. Cadastro de vários dias na mesma transação

- **Status** Aceita
- **Data** 2026-11-22

## Contexto

Uma professora pode agendar vários dias para o mesmo aluno em um formulário. Um conflito em qualquer dia precisa desfazer o envio inteiro. Parte dos horários reservados por séries semanais ainda está fora das oito semanas de aulas materializadas.

## Decisão

A aplicação valida os blocos e chama a função `create_lesson_days` uma vez. O Postgres adquire o bloqueio de gravação da agenda do workspace e processa os dias na ordem do formulário. Cada bloco cria uma aula avulsa ou uma série com identidade própria. Uma exceção desfaz a transação e informa a posição do bloco à aplicação.

A verificação usa as aulas existentes e projeta as ocorrências semanais no fuso do workspace. Uma ocorrência já gravada tem precedência sobre a projeção, inclusive quando foi cancelada. Para duas séries sem término, a comparação inclui um ciclo anual de mudanças de horário e mais uma semana após o início comum ou a última ocorrência já materializada, o que ocorrer por último.

## Alternativas consideradas

Chamadas independentes por dia poderiam deixar a primeira série salva após um erro na segunda. Conferir apenas a primeira aula de cada série permitiria conflitos com aulas avulsas posteriores ou com séries que começam em outra semana.

## Consequências

A professora pode corrigir o bloco indicado e reenviar o formulário completo. A ficha do aluno e a edição individual continuam usando a identidade de cada série.
