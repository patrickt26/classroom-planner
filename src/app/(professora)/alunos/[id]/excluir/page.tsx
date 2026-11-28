import { notFound } from "next/navigation";
import { EraseStudentForm } from "@/features/students/components/erase-student-form";
import { getStudent } from "@/features/students/queries";

export const metadata = {
  title: "Excluir dados do aluno | Planejamento de aulas",
};

export default async function EraseStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const student = await getStudent((await params).id);
  if (!student.archived_at || student.anonymized_at) notFound();

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <h1 className="text-3xl font-bold text-brown">Excluir dados do aluno</h1>
      <p className="wrap-anywhere">
        Você está atendendo a um pedido de exclusão dos dados de{" "}
        <strong>{student.name}</strong>. Esta ação é definitiva.
      </p>
      <section className="grid gap-2 rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-xl font-bold text-brown">O que será apagado</h2>
        <p>
          Os dados pessoais, as disciplinas do cadastro, os planos e registros
          de aula, as séries recorrentes e as aulas sem cobrança. O vínculo com
          cada responsável também será removido. Apagamos o contato do
          responsável se ele não acompanhar outro aluno do espaço.
        </p>
        <h2 className="mt-2 text-xl font-bold text-brown">
          O que fica no financeiro
        </h2>
        <p>
          As aulas com cobrança, os valores por hora, as cobranças e os
          pagamentos ficam em nome de “Aluno removido” pelo prazo legal. Os
          links de reunião e as observações dos pagamentos serão apagados.
        </p>
      </section>
      <EraseStudentForm id={student.id} name={student.name} />
    </div>
  );
}
