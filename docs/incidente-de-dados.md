# Roteiro de resposta a incidentes de dados

## 1. Identificar o incidente

Um incidente de segurança com dados pessoais acontece quando informações são acessadas, divulgadas, alteradas, perdidas ou ficam indisponíveis sem autorização ou por acidente. Comece a apurar e conter assim que houver suspeita.

### Exemplos no Classroom Planner

- Uma chave administrativa do Supabase ou uma chave SMTP da Brevo aparece em um commit, PR ou log do GitHub.
- Uma falha na política de acesso do banco (RLS) permite que uma professora veja a ficha de um aluno de outro workspace.
- Alguém entra na conta de uma professora e consulta fichas ou altera registros de aula.
- Um convite ou link de recuperação de senha chega ao endereço errado.
- Um fornecedor informa que terceiros tiveram acesso a credenciais, e-mails ou dados do projeto.

## 2. Conter na primeira hora

Acione o encarregado pelo canal interno e anote a hora da descoberta, quem avisou e o que está confirmado. Preserve os registros de atividade (logs), os horários com fuso e as referências de mensagens ou deploys em local privado. Guarde só o necessário e contenha a exposição já nessa etapa.

| Situação | Onde agir e o que fazer |
| --- | --- |
| Chave administrativa do Supabase exposta | No projeto, abra **Settings → API Keys**. Revogue a chave secreta exposta, gere outra e atualize as integrações que a usavam. Para uma `service_role` legada, siga a rotação de chaves legadas do Supabase, incluindo a revogação do segredo JWT legado em **Settings → JWT Keys**. [Rotação de chaves vazadas](https://supabase.com/docs/guides/security/rotate-leaked-api-keys) |
| Chave da Brevo exposta | Abra **Settings → SMTP & API**. Em **SMTP** ou **API Keys & MCP**, desative a chave comprometida e gere outra. Para SMTP, atualize a credencial em **Authentication → SMTP Settings** no Supabase. Atualize as demais integrações afetadas e remova a chave antiga. [Chaves SMTP da Brevo](https://help.brevo.com/hc/en-us/articles/7959631848850-Create-and-manage-your-SMTP-keys) · [Chaves de API da Brevo](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys) · [SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp) |
| Conta de professora invadida | No Supabase, localize a conta em **Authentication → Users**. Bloqueie temporariamente novos logins e restrinja o acesso da conta aos dados em **Database → Policies**. Combine a redefinição da senha por um canal confirmado e revogue todas as sessões pelo Supabase Auth (`signOut` com escopo `global`, usando uma sessão legítima da conta em ambiente seguro). Mantenha a restrição aos dados até os tokens de acesso antigos expirarem. [Encerramento de sessões no Supabase](https://supabase.com/docs/guides/auth/signout) |
| Falha de acesso entre workspaces | No Supabase, abra **Database → Policies** para revisar a RLS. Use o **SQL Editor** para aplicar a correção urgente no banco, se necessário, e versione a mesma correção em uma nova migração. Antes de liberar o acesso, valide em ambiente de teste com duas contas fictícias de workspaces diferentes. [Proteção da API no Supabase](https://supabase.com/docs/guides/api/securing-your-api) |
| Deploy de produção mantém a exposição | Na Vercel, abra **Settings → General → Pause Project**. Confira que a publicação ficou indisponível e verifique se algum preview afetado continua acessível. Se precisar substituir uma credencial usada pela aplicação, atualize **Settings → Environment Variables** e faça um novo deploy com os valores atualizados. Contenha também no Supabase se a exposição estiver no banco ou na API. [Pausa de projeto na Vercel](https://vercel.com/docs/projects/managing-projects#pause-a-project-from-the-dashboard) · [Variáveis de ambiente na Vercel](https://vercel.com/docs/environment-variables) |
| E-mail enviado à pessoa errada | Na Brevo, confira o envio em **Transactional → Logs**. Se a mensagem levava um link de acesso, bloqueie o acesso associado no Supabase em **Authentication → Users** e verifique se houve login. Peça ao destinatário indevido que exclua a mensagem e evite encaminhá-la. [Logs transacionais da Brevo](https://help.brevo.com/hc/en-us/articles/360021533839-Manage-your-transactional-logs-and-email-previews) |
| Chave publicada no GitHub | Revogue a chave no fornecedor que a emitiu. No repositório, confira **Security → Secret scanning** e remova a exposição de arquivos, PRs ou logs de Actions conforme o caso. [Orientação do GitHub para segredos vazados](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret) |
| Incidente em um fornecedor | Abra um chamado privado pelo [canal oficial do fornecedor](#6-contatos-de-segurança-dos-fornecedores). Peça o período, os serviços e os dados afetados, além das medidas já adotadas. Revogue as credenciais expostas no painel do emissor. |

## 3. Avaliar o risco com o encarregado

- Identifique os workspaces e as categorias de dados afetadas, como nome, contato de responsável, endereço de aula, observações pedagógicas, dados de saúde, cobranças e credenciais.
- Conte as pessoas afetadas, incluindo crianças e adolescentes. Registre o total confirmado, a melhor estimativa disponível e o período da exposição.
- Verifique quem teve acesso, se os dados podem ter sido copiados ou alterados, se podem ser recuperados e quais danos ainda podem ocorrer após a contenção.

Há risco ou dano relevante quando o incidente pode afetar significativamente os direitos ou interesses das pessoas e envolve pelo menos um dos critérios do regulamento. Eles incluem dados de crianças, adolescentes ou idosos, dados sensíveis, financeiros, de autenticação, protegidos por sigilo legal, judicial ou profissional, ou dados pessoais em larga escala. Considere danos como fraude, discriminação e risco à segurança física. [Resolução CD/ANPD nº 15/2024, art. 5º](https://bibliotecadigital.mj.gov.br/bitstream/1/12879/1/RES_ANPD_2024_15.pdf)

| Exemplo | Risco relevante? | Motivo |
| --- | --- | --- |
| Pessoa sem autorização acessou fichas com nomes e endereços de aula de crianças. | **Sim** | A exposição pode comprometer a segurança física. |
| Um link de recuperação enviado ao endereço errado foi usado para entrar no workspace. | **Sim** | O acesso indevido pode expor ou permitir alterações nos dados dos alunos. |
| Um aviso de manutenção foi enviado à professora errada e trazia apenas o nome profissional da destinatária original. | **Não**, se a avaliação confirmar baixo impacto. | A mensagem expôs apenas o nome, sem acesso ao workspace ou potencial identificado de dano significativo. |

Registre o motivo da decisão e reavalie assim que surgirem fatos novos. Se houver indícios de risco relevante e a investigação ainda estiver em andamento, prepare a comunicação preliminar com os fatos conhecidos.

## 4. Comunicar em até 3 dias úteis

Quando houver risco ou dano relevante, a controladora comunica à ANPD e às pessoas afetadas. Para este roteiro, adote o prazo geral de **até 3 dias úteis**, contados de quando a controladora soube que o incidente afetou dados pessoais. Registre esse momento. [LGPD, art. 48](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) · [Resolução CD/ANPD nº 15/2024, arts. 6º e 9º](https://bibliotecadigital.mj.gov.br/bitstream/1/12879/1/RES_ANPD_2024_15.pdf)

1. **Professora afetada.** A equipe do app, como operadora dos dados de alunos e responsáveis, avisa imediatamente cada professora afetada por um canal privado e confirmado. A professora é a controladora desses dados e avisa as famílias. A equipe repassa o que sabe, indica o que está em apuração e ajuda com o formulário e as comunicações.
2. **ANPD.** A controladora protocola a comunicação pelo encarregado ou por representante constituído. No SEI! ANPD, abra **Peticionamento → Processo Novo**, escolha o processo de comunicação de incidente, preencha o formulário e anexe a comprovação do vínculo do encarregado ou dos poderes do representante. Se faltarem informações, envie o formulário preliminar dentro dos 3 dias úteis e justifique a complementação, que pode ser enviada em até 20 dias úteis a partir da comunicação inicial. Guarde o protocolo. [Formulário e instruções da ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis)
3. **Pessoas afetadas.** A professora avisa cada pessoa afetada ou, no caso de alunos menores, seus responsáveis. Use linguagem simples e um canal direto e individual sempre que possível. Se o aviso individual for inviável, publique um aviso de fácil acesso dentro do mesmo prazo e mantenha-o visível por pelo menos três meses. Junte ao processo na ANPD a declaração de que o aviso foi feito e por quais meios, em até 3 dias úteis após o fim do prazo para avisar as pessoas afetadas. Quando o incidente envolver dados sob controle da própria plataforma, a equipe assume essas comunicações. [Resolução CD/ANPD nº 15/2024, art. 9º](https://bibliotecadigital.mj.gov.br/bitstream/1/12879/1/RES_ANPD_2024_15.pdf)

### Modelo de mensagem da professora às famílias

> **Assunto — Aviso de incidente de segurança**
>
> Olá. Em [data em que soubemos], identificamos [o que aconteceu]. Os dados afetados foram [categorias de dados] e o incidente pode causar [possíveis consequências]. Os dados estavam protegidos por [medidas de segurança]. Já fizemos [medidas tomadas] e vamos [próximos passos]. Você pode [ação prática, se aplicável]. [Se houve atraso, explique o motivo.] Para dúvidas, use [canal de contato e, quando aplicável, contato do encarregado].

## 5. Registrar e guardar

A controladora guarda o registro de cada incidente com dados pessoais, inclusive os que não forem comunicados, por **pelo menos 5 anos a partir da data do registro**. Guarde o registro e as evidências necessárias em local privado com acesso restrito, fora do repositório público, das issues e dos PRs. [Resolução CD/ANPD nº 15/2024, art. 10](https://bibliotecadigital.mj.gov.br/bitstream/1/12879/1/RES_ANPD_2024_15.pdf)

### Modelo de registro

| Campo | Preenchimento |
| --- | --- |
| Datas e horários | [ocorrência ou período estimado, descoberta, ciência da controladora e data do registro] |
| O que aconteceu | [circunstâncias, causa conhecida, ambientes e workspaces envolvidos, referências privadas às evidências] |
| Dados e pessoas afetadas | [categorias de dados, quantidade confirmada ou estimada e quantas são crianças ou adolescentes] |
| Avaliação de risco | [relevante sim/não, possíveis danos, possibilidade de reversão e justificativa] |
| Medidas | [contenção, correção e redução do impacto, com datas e responsáveis] |
| Comunicações | [se avisou a professora, a ANPD e as pessoas afetadas, quando, por qual canal, conteúdo enviado e protocolo, quando aplicável] |
| Motivos para ausência de comunicação | [justificativa, quando aplicável] |

## 6. Contatos de segurança dos fornecedores

- [Supabase — canal de segurança](https://supabase.com/contact-us)
- [Vercel — central de suporte](https://vercel.com/docs/support-center)
- [Brevo — suporte para conta comprometida](https://help.brevo.com/hc/en-us/articles/4409685261714-My-account-has-been-compromised-what-should-I-do)
- [GitHub — portal de suporte](https://docs.github.com/en/support/contacting-github-support)
