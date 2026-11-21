import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveLesson } from "@/features/lessons/actions";
import { agendaDateSchema } from "@/features/lessons/agenda-schema";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";
import { LessonForm } from "@/features/lessons/components/lesson-form";
import { getLessonOptions } from "@/features/lessons/queries";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Nova aula | Agenda" };

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string | string[] }>;
}) {
  const { time_zone } = await requireTeacherWorkspace();
  const params = await searchParams;
  const date = agendaDateSchema
    .catch(localLessonDateTime(new Date(), time_zone).slice(0, 10))
    .parse(params.data);
  const options = await getLessonOptions();
  const backHref = agendaHref(date);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-3xl font-bold text-brown">Nova aula</h1>
      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        {options.students.length > 0 && options.subjects.length > 0 ? (
          <LessonForm
            timeZone={time_zone}
            {...options}
            action={saveLesson.bind(null, null)}
            backHref={backHref}
            initialValues={{
              student_id: "",
              subject_id: "",
              date,
              time: "09:00",
              duration_minutes: "60",
              modality: "presencial",
              meeting_url: "",
              status: "agendada",
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
              <Button asChild variant="outline">
                <Link href={backHref}>Voltar para a agenda</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
