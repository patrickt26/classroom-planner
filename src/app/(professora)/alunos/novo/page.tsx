import { saveStudent } from "@/features/students/actions";
import {
  BackToStudents,
  StudentForm,
} from "@/features/students/components/student-form";
import { emptyStudentForm } from "@/features/students/form-state";
import { getStudentOptions } from "@/features/students/queries";

export const metadata = { title: "Cadastrar aluno | Planejamento de aulas" };

export default async function NewStudentPage() {
  const options = await getStudentOptions();
  return (
    <div className="max-w-3xl">
      <BackToStudents />
      <h1 className="mb-5 text-3xl font-bold text-brown">Cadastrar aluno</h1>
      <section
        aria-label="Cadastro do aluno"
        className="rounded-xl border bg-card p-4 sm:p-6"
      >
        <StudentForm
          action={saveStudent.bind(null, null, false)}
          initialValues={emptyStudentForm}
          listHref="/alunos"
          requireGuardian
          {...options}
        />
      </section>
    </div>
  );
}
