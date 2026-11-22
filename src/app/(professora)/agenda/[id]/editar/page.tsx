import {
  cancelLesson,
  deleteLesson,
  saveLesson,
} from "@/features/lessons/actions";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";
import { LessonConfirmationForm } from "@/features/lessons/components/lesson-confirmation-form";
import { LessonForm } from "@/features/lessons/components/lesson-form";
import { OccurrenceActions } from "@/features/lessons/components/occurrence-actions";
import { lessonStatusLabels } from "@/features/lessons/form-state";
import {
  getEditableLesson,
  getLessonOptions,
} from "@/features/lessons/queries";
import { getActiveRecurrence } from "@/features/recurrences/queries";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Editar aula | Agenda" };

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { time_zone } = await requireTeacherWorkspace();
  const { id } = await params;
  const lesson = await getEditableLesson(id);
  const [date, time] = localLessonDateTime(
    new Date(lesson.starts_at),
    time_zone,
  ).split("T");

  if (lesson.recurrence_id) {
    const today = localLessonDateTime(new Date(), time_zone).slice(0, 10);
    const series = await getActiveRecurrence(lesson.recurrence_id, today);
    return (
      <div className="grid max-w-4xl gap-5">
        <h1 className="text-3xl font-bold text-brown">Editar aula</h1>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <section className="grid gap-2 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-xl font-bold text-brown">Só esta aula</h2>
            <p>Situação atual: {lessonStatusLabels[lesson.status]}</p>
            <OccurrenceActions lesson={lesson} canChangeStatus />
          </section>
          <section className="grid gap-2 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-xl font-bold text-brown">Toda a série</h2>
            {series ? (
              <Button asChild variant="outline" className="w-fit">
                <Link href={`/agenda/series/${series.id}/editar`}>
                  Editar ou encerrar série
                </Link>
              </Button>
            ) : (
              <p>Esta série já terminou.</p>
            )}
          </section>
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href={agendaHref(date)}>Voltar para a agenda</Link>
        </Button>
      </div>
    );
  }

  const options = await getLessonOptions(lesson.student_id, lesson.subject_id);
  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-3xl font-bold text-brown">Editar aula</h1>
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <LessonForm
          timeZone={time_zone}
          {...options}
          editing
          action={saveLesson.bind(null, id, null)}
          backHref={agendaHref(date)}
          initialValues={{
            student_id: lesson.student_id,
            subject_id: lesson.subject_id,
            date,
            time,
            duration_minutes: String(lesson.duration_minutes),
            modality: lesson.modality,
            meeting_url: lesson.meeting_url ?? "",
            status: lesson.status,
            repeat_weekly: "",
            end_date: "",
          }}
        />
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
          <LessonConfirmationForm
            operation="cancel"
            action={cancelLesson.bind(null, id)}
          />
          {lesson.canDelete && (
            <LessonConfirmationForm
              operation="delete"
              action={deleteLesson.bind(null, id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
