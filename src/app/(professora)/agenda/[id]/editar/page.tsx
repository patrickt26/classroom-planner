import { cancelLesson, saveLesson } from "@/features/lessons/actions";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";
import { CancelLessonForm } from "@/features/lessons/components/cancel-lesson-form";
import { LessonForm } from "@/features/lessons/components/lesson-form";
import {
  getEditableLesson,
  getLessonOptions,
} from "@/features/lessons/queries";
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
  const options = await getLessonOptions(lesson.student_id);
  const [date, time] = localLessonDateTime(
    new Date(lesson.starts_at),
    time_zone,
  ).split("T");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-3xl font-bold text-brown">Editar aula</h1>
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <LessonForm
          timeZone={time_zone}
          {...options}
          editing
          action={saveLesson.bind(null, id)}
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
          }}
        />
        <div className="mt-5 border-t pt-5">
          <CancelLessonForm action={cancelLesson.bind(null, id)} />
        </div>
      </div>
    </div>
  );
}
