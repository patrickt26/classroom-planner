import { redirect } from "next/navigation";
import { changeStudentStatus, saveStudent } from "@/features/students/actions";
import {
  BackToStudents,
  StudentForm,
  StudentStatusForm,
} from "@/features/students/components/student-form";
import { getStudent, getStudentOptions } from "@/features/students/queries";

export const metadata = { title: "Editar aluno | Planejamento de aulas" };

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);
  if (student.anonymized_at) redirect(`/alunos/${student.id}`);
  const subjectIds = student.student_subjects.map(
    ({ subject_id }) => subject_id,
  );
  const options = await getStudentOptions(student.grade_id, subjectIds);
  const archived = student.archived_at !== null;
  const listHref = archived ? "/alunos?situacao=arquivados" : "/alunos";
  return (
    <div>
      <BackToStudents href={listHref} />
      <h1 className="mb-5 text-3xl font-bold text-brown">Editar aluno</h1>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section
          aria-label="Cadastro do aluno"
          className="rounded-xl border bg-card p-4 sm:p-6"
        >
          <StudentForm
            action={saveStudent.bind(null, student.id, archived)}
            initialValues={{
              name: student.name,
              birth_date: student.birth_date ?? "",
              grade_id: student.grade_id ?? "",
              school: student.school ?? "",
              hourly_rate: student.is_free
                ? ""
                : (student.hourly_rate / 100).toFixed(2).replace(".", ","),
              is_free: student.is_free,
              notes: student.notes ?? "",
              subject_ids: subjectIds,
            }}
            listHref={listHref}
            {...options}
          />
        </section>
        <section className="grid gap-3 rounded-xl border bg-card p-4 sm:p-6">
          <h2 className="font-bold">Situação do aluno</h2>
          <p className="text-sm text-muted-foreground">
            {archived
              ? "Aluno arquivado. Reative o cadastro para voltar à lista de ativos."
              : "Ao arquivar, o aluno sai da lista de ativos e o cadastro é preservado."}
          </p>
          <StudentStatusForm
            action={changeStudentStatus.bind(null, student.id)}
            archived={archived}
          />
        </section>
      </div>
    </div>
  );
}
