import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { saveLesson } from "@/features/lessons/actions";
import { agendaDateSchema } from "@/features/lessons/agenda-schema";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";
import { LessonForm } from "@/features/lessons/components/lesson-form";
import { getLessonOptions } from "@/features/lessons/queries";
import { getStudent } from "@/features/students/queries";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Nova aula | Agenda" };

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{
    data?: string | string[];
    aluno?: string | string[];
  }>;
}) {
  const { time_zone } = await requireTeacherWorkspace();
  const params = await searchParams;
  const date = agendaDateSchema
    .catch(localLessonDateTime(new Date(), time_zone).slice(0, 10))
    .parse(params.data);
  const options = await getLessonOptions();
  const studentId = z.uuid().safeParse(params.aluno).data;
  const student =
    options.students.some(({ id }) => id === studentId) && studentId
      ? await getStudent(studentId)
      : null;
  const [studentSubject] = student?.student_subjects ?? [];
  const subjectId =
    student?.student_subjects.length === 1 &&
    options.subjects.some(({ id }) => id === studentSubject.subject_id)
      ? studentSubject.subject_id
      : "";
  const backHref = student ? `/alunos/${student.id}` : agendaHref(date);
  const backLabel = student ? "Voltar para a ficha" : "Voltar para a agenda";

  return (
    <div className="max-w-5xl">
      <h1 className="mb-5 text-3xl font-bold text-brown">Nova aula</h1>
      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        {options.students.length > 0 && options.subjects.length > 0 ? (
          <LessonForm
            {...options}
            action={saveLesson.bind(null, null, student?.id ?? null)}
            backHref={backHref}
            backLabel={backLabel}
            initialValues={{
              student_id: student?.id ?? "",
              subject_id: subjectId,
              date,
              time: "09:00",
              duration_minutes: "60",
              modality: "presencial",
              meeting_url: "",
              status: "agendada",
              repeat_weekly: "",
              end_date: "",
            }}
          />
        ) : (
          <>
            <p>
              Você precisa de um aluno ativo e uma disciplina para agendar uma
              aula.
            </p>
            <div className="flex flex-wrap gap-2">
              {options.students.length === 0 && (
                <Button asChild>
                  <Link href="/alunos/novo">Cadastrar aluno</Link>
                </Button>
              )}
              {options.subjects.length === 0 && (
                <Button asChild>
                  <Link href="/configuracoes#materias">Cadastrar matéria</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
