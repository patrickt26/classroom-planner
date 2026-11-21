# 0008. Geração de aulas recorrentes no Postgres

- **Status** Aceita
- **Data** 2026-11-20

## Contexto

A agenda precisa mostrar as próximas aulas mesmo quando a professora passa dias sem abrir o aplicativo. Cancelamentos individuais e reposições precisam sobreviver às próximas execuções do gerador.

## Decisão

O Postgres materializa oito semanas de aulas ao salvar uma recorrência. Um job diário do pg_cron estende a janela. As duas operações usam o mesmo gerador e serializam alterações pela linha da recorrência. Um índice único identifica cada ocorrência pelo workspace, pela série e pelo instante de início.

A regra semanal guarda dia e hora locais. O gerador usa o fuso do workspace para obter o instante da aula. Em transições de horário de verão, um horário inexistente é pulado. Na hora repetida, a agenda e o banco usam a ocorrência posterior.

## Alternativas consideradas

Gerar aulas ao abrir a agenda tornaria a disponibilidade dos registros dependente de visitas à página. Criar a série inteira de uma vez exigiria uma data final, inclusive para alunas que continuam semanalmente por tempo indeterminado.

## Consequências

A professora pode cancelar uma ocorrência preservando a linha que impede sua recriação. Ao editar ou encerrar a série, o banco preserva aulas passadas e ocorrências com falta, cancelamento ou reposição. A reposição tem identidade própria e aponta para a aula que lhe deu origem.
