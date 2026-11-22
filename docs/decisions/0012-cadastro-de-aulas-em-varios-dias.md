# 0012. Cadastro de vários dias na mesma transação

- **Status** Aceita
- **Data** 2026-11-22

## Contexto

Uma professora pode agendar vários dias para o mesmo aluno em um formulário. Irmãos e grupos podem ter aulas no mesmo horário. A professora precisa distinguir essas sobreposições intencionais de um engano antes de salvar. Parte dos horários reservados por séries semanais ainda está fora das oito semanas de aulas materializadas.

## Decisão

A aplicação valida os blocos e chama a função `create_lesson_days` uma vez. O Postgres adquire o bloqueio de gravação da agenda do workspace e processa os dias na ordem do formulário. Cada bloco cria uma aula avulsa ou uma série com identidade própria. Uma exceção desfaz a transação e informa a posição do bloco à aplicação.

No primeiro envio, `allow_conflicts` assume o padrão `false`. Ao detectar uma sobreposição, a função lança `lesson_day_conflict` com o índice do bloco (a partir de 1) e desfaz todos os dias. O formulário preserva os valores e oferece **Salvar mesmo assim** no dia indicado. Esse botão reenvia todos os blocos com `allow_conflicts = true`. A função verifica os horários novamente e devolve se encontrou algum conflito no envio que gravou. A agenda usa esse resultado para confirmar o agendamento e avisar sobre a sobreposição. Qualquer outro erro continua desfazendo a transação inteira. [Decisão na issue #61](https://github.com/patrickt26/classroom-planner/issues/61#issuecomment-7082349978)

A verificação usa as aulas existentes e projeta as ocorrências semanais no fuso do workspace. Uma ocorrência já gravada tem precedência sobre a projeção, inclusive quando foi cancelada. Para duas séries sem término, a comparação inclui um ciclo anual de mudanças de horário e mais uma semana após o início comum ou a última ocorrência já materializada, o que ocorrer por último.

## Alternativas consideradas

Chamadas independentes por dia poderiam deixar a primeira série salva após um erro na segunda. Conferir apenas a primeira aula de cada série permitiria conflitos com aulas avulsas posteriores ou com séries que começam em outra semana.

## Consequências

A professora pode corrigir o horário ou confirmar as sobreposições do envio inteiro. Alterar os dados do formulário exige uma nova verificação antes de confirmar. A ficha do aluno e a edição individual continuam usando a identidade de cada série.
