import type { Metadata } from "next";
import {
  legalVersion,
  legalVersionLabel,
} from "../../../features/legal/version";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <>
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-brown">Termos de uso</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização em{" "}
          <time dateTime={legalVersion}>{legalVersionLabel}</time>
        </p>
      </header>
      <div className="grid gap-6 leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brown">
        <section>
          <h2>Acesso e uso permitido</h2>
          <p>
            O cadastro no piloto é exclusivo para professoras convidadas. Use a
            plataforma para organizar seus alunos, aulas, planejamentos,
            registros pedagógicos e cobranças. Mantenha a senha em sigilo e
            acesse somente o espaço para o qual tem autorização.
          </p>
        </section>
        <section>
          <h2>Responsabilidade pelos dados cadastrados</h2>
          <p>
            A professora é responsável pelos dados que cadastra. Registre apenas
            o necessário para o atendimento. Antes de cadastrar dados de
            crianças ou adolescentes, explique o uso das informações e obtenha o
            consentimento específico, em destaque, de um dos pais ou do
            responsável legal. Respeite o melhor interesse do aluno e atenda aos
            pedidos sobre seus dados.
          </p>
        </section>
        <section>
          <h2>Disponibilidade durante o piloto</h2>
          <p>
            O serviço está em piloto e pode sofrer falhas, interrupções e
            mudanças. A plataforma é oferecida sem garantia de disponibilidade
            contínua.
          </p>
        </section>
        <section>
          <h2>Encerramento da conta</h2>
          <p>
            A professora pode solicitar o encerramento da conta e a exclusão dos
            dados pelo contato abaixo. A plataforma atende ao pedido observando
            os prazos de conservação exigidos por lei.
          </p>
        </section>
      </div>
    </>
  );
}
