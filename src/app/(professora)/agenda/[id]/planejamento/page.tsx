import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PreviousLessonNote } from "@/features/lesson-notes/components/previous-lesson-note";
import { saveLessonPlan } from "@/features/lesson-plans/actions";
import { CopyLessonPlanForm } from "@/features/lesson-plans/components/copy-lesson-plan-form";
import { LessonPlanForm } from "@/features/lesson-plans/components/lesson-plan-form";
import { getLessonPlanning } from "@/features/lesson-plans/queries";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";

export const metadata = { title: "Planejamento da aula | Agenda" };

export default async function LessonPlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    copiar?: string | string[];
    origem?: string | string[];
    salvo?: string | string[];
  }>;
}) {
  const [{ id }, { copiar, origem, salvo }] = await Promise.all([
    params,
    searchParams,
  ]);
  const fromToday = origem === "hoje";
  const { lesson, previousLessons, copy, previousNote, timeZone } =
    await getLessonPlanning(id, copiar);
  const plan = lesson.lesson_plans;
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  });
  const agenda = agendaHref(
    localLessonDateTime(new Date(lesson.starts_at), timeZone).slice(0, 10),
  );

  return (
    <div className="grid max-w-4xl gap-5">
      <header className="grid gap-1">
        <Button asChild variant="link" className="w-fit px-0 underline">
          <Link href={fromToday ? "/" : agenda}>
            {fromToday ? "Voltar para Hoje" : "Voltar para a agenda"}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-brown">Planejamento da aula</h1>
        <p className="wrap-anywhere font-semibold">
          {lesson.students?.name} · {lesson.subjects?.name}
        </p>
        <time
          dateTime={lesson.starts_at}
          className="text-sm text-muted-foreground"
        >
          {formatter.format(new Date(lesson.starts_at))}
        </time>
      </header>
      {salvo === "1" && plan && (
        <Alert variant="success" message="Plano salvo." />
      )}
      {previousNote && <PreviousLessonNote note={previousNote} />}
      {!!previousLessons.length && (
        <CopyLessonPlanForm
          key={id}
          lessonId={id}
          lesson={lesson}
          previousLessons={previousLessons}
          copySourceId={copy ? String(copiar) : ""}
          fromToday={fromToday}
          timeZone={timeZone}
        />
      )}
      {copy && (
        <Alert
          variant="info"
          message="Revise a cópia e salve o plano desta aula."
        />
      )}
      {!plan && copiar && !copy && (
        <Alert
          variant="error"
          message="O plano escolhido não está disponível para esta aula."
        />
      )}
      <LessonPlanForm
        key={plan ? "saved" : copy ? String(copiar) : "new"}
        action={saveLessonPlan.bind(null, id, Boolean(plan), fromToday)}
        initialValues={
          plan ??
          copy ?? { objective: "", content: "", activities: "", materials: "" }
        }
      />
    </div>
  );
}
