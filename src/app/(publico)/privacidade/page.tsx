import type { Metadata } from "next";
import {
  legalVersion,
  legalVersionLabel,
} from "../../../features/legal/version";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  const officerName = process.env.NEXT_PUBLIC_PRIVACY_OFFICER_NAME?.trim();
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <>
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-brown">
          Política de privacidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Última atualização em{" "}
          <time dateTime={legalVersion}>{legalVersionLabel}</time>
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
          <h2>Empresas que tratam os dados</h2>
          <ul className="list-disc space-y-2 ps-5">
            <li>
              <strong>Supabase.</strong> Fornece o banco de dados e a
              autenticação. Recebe todos os dados do aplicativo. O banco fica na
              região de São Paulo, Brasil, e a empresa está sediada nos Estados
              Unidos.
            </li>
            <li>
              <strong>Vercel.</strong> Hospeda e executa o aplicativo. Recebe as
              requisições e os logs técnicos. As funções são executadas na
              região de São Paulo, Brasil, e a empresa está sediada nos Estados
              Unidos.
            </li>
            <li>
              <strong>Brevo.</strong> Envia os e-mails de convite e de troca de
              senha. Recebe o e-mail da professora e o conteúdo da mensagem. A
              empresa está sediada na União Europeia.
            </li>
          </ul>
          <p>
            Os fornecedores podem processar informações de infraestrutura em
            outros países.
          </p>
          <p>
            O banco usa políticas de acesso por linha (RLS) para isolar os
            espaços das professoras. O Supabase criptografa os dados
            armazenados, e o acesso à aplicação em produção usa HTTPS.
          </p>
        </section>
        <section>
          <h2>Por quanto tempo guardamos os dados</h2>
          <ul className="list-disc space-y-2 ps-5">
            <li>
              Guardamos os dados da conta e do espaço enquanto a conta estiver
              ativa.
            </li>
            <li>
              Quando o responsável pede a exclusão dos dados de um aluno, a
              professora apaga os dados pessoais e pedagógicos em até 30 dias.
              As cobranças e os pagamentos ficam anonimizados pelo prazo
              necessário ao cumprimento das obrigações legais.
            </li>
            <li>
              Apagamos os dados da conta e do espaço em até 30 dias após o
              pedido de exclusão da conta ou seu encerramento. Antes de
              encerrá-la, a professora deve baixar os dados que precisar guardar
              por obrigação própria, como registros de cobrança.
            </li>
            <li>
              As cópias de segurança e os logs técnicos expiram conforme o ciclo
              de cada fornecedor.
            </li>
          </ul>
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
        <section>
          <h2>Encarregado pelo tratamento de dados</h2>
          {officerName && <p>Nome do encarregado: {officerName}</p>}
          {contactEmail ? (
            <a
              className="inline-flex min-h-11 max-w-full items-center break-all underline underline-offset-4"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          ) : (
            <p>
              Para falar com o encarregado, solicite o contato a quem enviou seu
              convite para o piloto.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
