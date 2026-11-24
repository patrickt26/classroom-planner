# 0014. Anexos no registro pós-aula

- **Status** Proposta
- **Data** 2026-11-23

## Contexto

A professora precisa guardar fotos de atividades e documentos junto ao registro pós-aula. Esses arquivos podem conter dados de crianças e adolescentes. O recurso é viável com o Supabase Storage, que já faz parte da stack. O plano Free comporta um piloto pequeno, com o espaço acumulado como primeiro limite no cenário estimado abaixo.

## Decisão

### Armazenamento e acesso

Usar um bucket privado `workspace-files` com chaves geradas pelo servidor no formato `<workspace_id>/lesson-attachments/<uuid>`. Guardar o nome de exibição, MIME, tamanho, chave e estado do arquivo no Postgres. Associar o anexo ao registro da aula por `workspace_id` e `lesson_id`, com FK composta para `lessons`. Permitir o envio após a primeira gravação em `lesson_notes`. A lista acompanha a aula quando uma edição do texto cria uma nova versão do registro.

Aplicar RLS aos metadados e a `storage.objects`. A leitura exige `public.has_role(workspace_id, 'teacher')` no workspace do registro, o bucket e a chave exatos de um anexo ativo. O prefixo da chave precisa coincidir com o workspace dos metadados. Alunos, responsáveis e visitantes ficam sem acesso. Reservar as gravações de arquivos e metadados a operações de servidor que encontrem o registro pela sessão da professora e validem o papel antes de usar credenciais privilegiadas. Assim, o navegador não consegue gravar diretamente no bucket e contornar a validação dos bytes. As credenciais privilegiadas ficam no servidor. [Controle de acesso do Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control)

Ao tocar em **Abrir** ou **Baixar**, gerar no servidor uma URL assinada do Supabase de 60 segundos para o objeto específico, usando a sessão da professora para aplicar RLS. A lista carrega somente metadados. Evitar persistir URLs assinadas, gravá-las em logs ou enviá-las para ferramentas de analytics. O link é acessível a quem o receber. Configurar `cacheControl` baixo e verificar a expiração com cache frio e quente na implantação. No Smart CDN, o cache pode continuar servindo o arquivo depois de o token expirar, e a invalidação por exclusão pode levar até 60 segundos para propagar. Se o ambiente servir o arquivo além da validade, emitir o link temporário para uma rota da aplicação que valide o prazo, a sessão e o estado do anexo a cada acesso, entregue os bytes com `Cache-Control: private, no-store` e mantenha a URL do Storage no servidor. [Comportamento de URLs assinadas no Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn#signed-urls-and-cdn-caching)

### Envio, lista e exclusão

- Aceitar fotos JPEG, PNG e WebP e documentos PDF. No celular, redimensionar fotos no navegador para até 1.600 px no lado maior, recodificar em WebP com qualidade inicial de 80% e descartar metadados como GPS. Armazenar apenas a versão processada. Preservar os bytes dos PDFs para manter legibilidade e formatação.
- Limitar cada arquivo armazenado a 4 MB (4.000.000 bytes) e cada registro a cinco anexos. Validar tamanho e formato no navegador para dar retorno imediato. Repetir no servidor a validação de tamanho e tipo pelo conteúdo, verificar que a imagem decodifica dentro dos limites e remover metadados residuais. Aplicar também o limite por arquivo no bucket. Reservar a vaga no banco com proteção contra envios concorrentes e usar uma chave nova para cada anexo.
- Listar no registro os anexos ativos com nome, tipo, tamanho e ações de abrir ou baixar e excluir. Exibir falhas de envio e exclusão com opção de repetir a operação. A lista mantém os anexos quando o texto do registro é revisado.
- Como Postgres e Storage são gravados separadamente, reservar o metadado antes do envio e ativá-lo depois que o objeto for salvo. Em uma exclusão confirmada pela professora, marcar o anexo como em exclusão para retirá-lo da lista e bloquear novas assinaturas. Remover o objeto pela API do Storage e concluir a remoção dos metadados só depois disso. Recuperar reservas e exclusões interrompidas com limpeza que possa ser repetida, mantendo as informações necessárias até confirmar a remoção do objeto. Impedir que uma exclusão da aula deixe arquivos sem referência. [Exclusão de objetos no Supabase Storage](https://supabase.com/docs/guides/storage/management/delete-objects)

## Estimativa de uso e custo

Valores conferidos em 23/11/2026 na página de preços do Supabase. As franquias de tráfego com e sem cache são separadas. O teto de upload do plano é por arquivo, enquanto o armazenamento acompanha o volume médio de arquivos durante o ciclo. [Preços do Supabase](https://supabase.com/pricing) · [Medição de armazenamento](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size)

| Item | Free | Pro |
| --- | ---: | ---: |
| Preço mensal de partida | US$ 0 | US$ 25 |
| Armazenamento de arquivos incluído | 1 GB | 100 GB, depois US$ 0,0213 por GB-mês |
| Tráfego mensal sem cache incluído | 5 GB | 250 GB, depois US$ 0,09 por GB |
| Tráfego mensal com cache incluído | 5 GB | 250 GB, depois US$ 0,03 por GB |
| Teto de upload anunciado | 50 MB | 500 GB |

Para estimar, considerar 20 aulas por mês por professora, um anexo de 0,5 MB em média por aula, duas aberturas por mês por anexo acumulado e nenhuma exclusão. Contar todo o tráfego dos anexos como sem cache e usar MB e GB decimais. Os valores de armazenamento são saldos no fim do mês para planejamento de capacidade.

| Cenário | Crescimento mensal | Armazenado ao fim de 6 meses | Tráfego no 6º mês | Custo estimado do Supabase |
| --- | ---: | ---: | ---: | ---: |
| Piloto com 10 professoras | 0,10 GB | 0,60 GB | Até 1,20 GB | US$ 0/mês no Free |
| Expansão para 50 professoras | 0,50 GB | 3,00 GB | Até 6,00 GB | US$ 25/mês no Pro, sem excedente nesse cenário |

No piloto, o saldo chega a 1 GB no fim do décimo mês. PDFs de 2 MB em média, com o mesmo volume de envios, levariam o saldo a 1,2 GB no fim do terceiro mês. Medir tamanho médio real, saldo e tráfego no painel do Supabase. Reavaliar o plano ao projetar 80% de qualquer franquia no ciclo seguinte, somando o uso das demais áreas. O custo Pro assume um projeto Micro e franquias disponíveis. Se o projeto já estiver no Pro e tiver folga nas franquias, o custo incremental dos anexos nesses cenários é zero.

## Alternativas e reaproveitamento no Marco 2

Um bucket público deixaria fotos acessíveis por um endereço permanente. Guardar os bytes no Postgres consumiria a franquia do banco e faria a aplicação servir os downloads. Comprimir antes do upload reduz o tráfego no celular e dispensa as transformações de imagem do Storage, que estão fora do plano Free. [Preços do Supabase](https://supabase.com/pricing)

A biblioteca de materiais poderá reutilizar o bucket, o padrão de chaves por workspace, a validação de arquivos, a assinatura temporária e a limpeza. Usará um prefixo próprio, como `<workspace_id>/materials/<uuid>`, e metadados e políticas próprios para catálogo, permissões e vínculos de materiais. As políticas de leitura continuarão vinculadas ao registro de origem de cada objeto, preservando o acesso restrito aos anexos pós-aula.
