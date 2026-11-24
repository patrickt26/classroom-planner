import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <>
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-brown">
          Política de privacidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Última atualização em{" "}
          <time dateTime="2026-11-23">23 de novembro de 2026</time>
        </p>
      </header>
      <div className="grid gap-6 leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brown">
        <section>
          <h2>Quais dados usamos e para quê</h2>
          <ul className="list-disc space-y-2 ps-5">
            <li>
              Usamos o e-mail e os dados de autenticação da professora para
              criar e proteger a conta e recuperar o acesso.
            </li>
            <li>
              O cadastro do aluno pode incluir nome, data de nascimento, escola,
              ano escolar e observações para organizar o atendimento e
              acompanhar a aprendizagem.
            </li>
            <li>
              Nome, telefone e parentesco dos responsáveis ajudam a professora a
              identificar quem acompanha o aluno e com quem tratar sobre o
              atendimento e as cobranças.
            </li>
            <li>
              Guardamos informações sobre aulas, planejamentos, registros
              pós-aula e pagamentos para organizar a agenda, acompanhar o
              trabalho pedagógico e controlar cobranças.
            </li>
          </ul>
          <p className="mt-3">
            A plataforma pede o mínimo necessário. A professora pode usar um
            apelido e deixar a escola e a data de nascimento em branco. Evite
            registrar diagnósticos ou informações de saúde.
          </p>
        </section>
        <section className="space-y-3">
          <h2>Quem é responsável e qual é a base legal</h2>
          <p>
            A plataforma usa os dados da conta da professora para prestar o
            serviço contratado e cumprir obrigações legais, quando aplicável. A
            professora é a controladora dos dados dos seus alunos e
            responsáveis. Quem mantém a plataforma atua como operador desses
            dados, seguindo as instruções da professora.
          </p>
          <p>
            Antes de cadastrar dados de crianças ou adolescentes no piloto, a
            professora deve informar as finalidades do uso e obter o
            consentimento específico, em destaque, de pelo menos um dos pais ou
            do responsável legal. A professora deve priorizar o melhor interesse
            da criança ou adolescente e facilitar a revogação do consentimento.
          </p>
        </section>
        <section className="space-y-3">
          <h2>Onde os dados ficam e quem os processa</h2>
          <p>
            O Supabase fornece o banco de dados e a autenticação. A Vercel
            hospeda e executa a aplicação. Para o piloto, o banco principal e as
            funções da aplicação têm São Paulo, Brasil, como região prevista. Os
            fornecedores podem processar informações de infraestrutura em outros
            países.
          </p>
          <p>
            O banco usa políticas de acesso por linha (RLS) para isolar os
            espaços das professoras. O Supabase criptografa os dados
            armazenados, e o acesso à aplicação em produção usa HTTPS.
          </p>
        </section>
        <section>
          <h2>Por quanto tempo guardamos os dados</h2>
          <p>
            Guardamos os dados enquanto forem necessários para manter a conta e
            prestar o serviço. Após o encerramento ou um pedido de exclusão,
            eliminamos os dados conforme o pedido e a legislação. Quando houver
            obrigação legal de guardar algum registro, conservamos esse registro
            pelo prazo exigido.
          </p>
        </section>
        <section>
          <h2>Cookies</h2>
          <p>
            Usamos apenas cookies essenciais para autenticar e manter a sessão.
            A plataforma funciona sem cookies de rastreamento, ferramentas de
            análise de uso ou banner de consentimento.
          </p>
        </section>
        <section>
          <h2>Seus direitos</h2>
          <p>
            Você pode pedir acesso, correção, exclusão e portabilidade dos seus
            dados, conforme a LGPD. Para dados de alunos e responsáveis, procure
            a professora. Para dados da conta da professora ou ajuda com o
            pedido, use o contato abaixo.
          </p>
        </section>
      </div>
    </>
  );
}
