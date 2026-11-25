# Changelog

Este arquivo registra as mudanças relevantes do Classroom Planner. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

O app segue o versionamento semântico. A versão MAIOR sobe quando algo deixa de funcionar como antes para quem usa (2.0.0). A MENOR sobe quando há novas funções compatíveis, inclusive a cada novo marco (Marco 2 em 1.1.0). A versão de CORREÇÃO cobre correções, ajustes e atualizações de dependências (1.0.1).

## [Não lançado]

### Adicionado

- A professora aceita os Termos de uso e a Política de privacidade no primeiro acesso e quando a versão muda. A data e a versão do aceite ficam em Configurações (#118).
- O cadastro de aluno exige a confirmação da autorização do responsável. A ficha mostra a data e permite registrar a autorização de alunos antigos (#119).
- Em Configurações, a professora pode baixar um JSON com os dados do seu espaço e da conta e consultar o contato para pedir exclusão (#120).
- O repositório declara todos os direitos reservados e documenta a criação do ícone do app com ajuda de IA (#137).

### Alterado

- A política de privacidade detalha os fornecedores, o contato do encarregado e o prazo de exclusão dos dados. O rodapé da página inicial e das páginas públicas reúne os termos, a política e o contato de privacidade (#117).

## [1.0.0] - 2026-11-24

### Adicionado

- **Acesso.** A professora entra por convite, pode recuperar a senha e trabalha em um espaço isolado (#5, #19). Os e-mails de convite, confirmação e recuperação de senha seguem a identidade visual do app (#112).
- **Alunos e responsáveis.** Cadastre, edite, busque e arquive alunos. Vincule um responsável no cadastro e use a ficha para agendar aulas e consultar pendências (#6, #7, #8, #58, #64).
- **Agenda.** Crie aulas avulsas ou recorrentes pelo mesmo formulário, cadastre vários dias da semana de uma vez e veja avisos de conflito de horários. Filtre a agenda semanal por aluno, reagende faltas ou cancelamentos como reposições e exclua aulas avulsas criadas por engano (#9, #10, #11, #38, #41, #61, #65).
- **Planejamento.** Crie um plano, filtre e copie planos de outras aulas e consulte o que ficou como próximo passo na última aula com registro (#12, #14, #66).
- **Registro pós-aula e linha do tempo.** Registre o que foi trabalhado, as dificuldades e os próximos passos, com histórico de edições. Consulte aulas, faltas, reposições e registros na ficha do aluno (#13, #15).
- **Cobranças e pagamentos.** Gere cobranças automaticamente por aula realizada quando houver valor por hora, confira os totais a receber, em atraso e recebidos no mês, e registre ou estorne pagamentos de uma ou várias aulas (#16, #17, #53, #60).
- **Configurações.** Ajuste nome e marca do espaço, escolha o primeiro dia da semana e gerencie matérias e séries. Itens arquivados podem ser reativados ou excluídos quando estão sem uso. A matéria padrão “Todas” atende aulas sem uma disciplina específica (#5, #31, #62, #63, #94, #96).
- **Hoje.** Consulte as aulas do dia e as pendências de registro, reposição e cobrança. Abra o planejamento direto pelo cartão da aula (#18, #125).
- **Páginas públicas.** Conheça a plataforma na página inicial e consulte a Política de Privacidade e os Termos de Uso. A interface tem navegação adaptada para celular e computador e telas de carregamento e erro (#4, #99, #100, #101).
- **Base técnica.** Aplicação em Node.js 26 e Next.js, com banco e autenticação no Supabase. O CI verifica formatação, tipos, testes de unidade, regras de acesso no banco e fluxos ponta a ponta no build de produção. O projeto aplica cabeçalhos de segurança, audita dependências de produção e varre segredos (#1, #2, #3, #5, #19, #98, #123).
- **Campos de data.** Escolha datas em um calendário nos formulários de aulas, séries, reposições, alunos e pagamentos (#69).

### Alterado

- **Agenda semanal.** A disposição das colunas se adapta à largura da tela, e os cartões identificam aulas presenciais e online com ícones (#67).
- **Formulários.** Padronização da exibição de datas e horários conforme o fuso da agenda e dos campos de seleção. O telefone de responsáveis ganha máscara durante a digitação (#68).
- **Navegação.** O menu lateral mantém a mesma largura entre as telas em que aparece (#88).

### Corrigido

- **Séries de aulas.** Editar uma série preserva as aulas que já têm registro ou cobrança (#48).
- **Reposições.** A data mínima da reposição é a data da aula original. Se for no mesmo dia, o horário também respeita o início da aula original (#59).
