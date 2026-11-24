import { MapPin, Video } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatCalendarDay,
  formatLessonTime,
  localLessonDateTime,
} from "../calendar";
import { lessonModalityLabels, lessonStatusLabels } from "../form-state";
import { canEditLesson, type WeekLesson } from "../queries";
import { OccurrenceActions } from "./occurrence-actions";

function LessonCard({
  lesson,
  timeZone,
}: {
  lesson: WeekLesson;
  timeZone: string;
}) {
  const startsAt = new Date(lesson.starts_at);
  const endsAt = new Date(
    startsAt.getTime() + lesson.duration_minutes * 60_000,
  );
  const start = formatLessonTime(startsAt, timeZone);
  const end = formatLessonTime(endsAt, timeZone);
  const nextDay =
    localLessonDateTime(endsAt, timeZone).slice(0, 10) !==
    localLessonDateTime(startsAt, timeZone).slice(0, 10);
  const cancelled = lesson.status === "cancelada";
  const student = lesson.students?.name ?? "Aluno";
  const editable = canEditLesson(lesson);
  const online = lesson.modality === "online";
  const ModalityIcon = online ? Video : MapPin;

  return (
    <li className="grid min-w-0 gap-2 rounded-lg border bg-card px-3 py-3 xl:px-1 xl:[&_form_[data-slot=button]]:px-1">
      <div className="grid gap-1.5">
        <p className="text-sm font-semibold tabular-nums">
          <time dateTime={lesson.starts_at}>{start}</time>
          {" – "}
          <time dateTime={endsAt.toISOString()}>{end}</time>
          {nextDay && (
            <span className="block text-xs font-normal">
              Término em outro dia
            </span>
          )}
        </p>
        <h3 className="wrap-anywhere font-semibold text-brown">{student}</h3>
        <p className="wrap-anywhere text-sm text-muted-foreground">
          {lesson.subjects?.name}
        </p>
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <ModalityIcon aria-hidden="true" className="size-4 shrink-0" />
          {lessonModalityLabels[lesson.modality]}
        </p>
        <Badge
          variant={
            cancelled
              ? "destructive"
              : lesson.status === "confirmada"
                ? "secondary"
                : "outline"
          }
          className="max-w-full whitespace-normal"
        >
          {lessonStatusLabels[lesson.status]}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-x-1 xl:gap-x-0">
        <Button asChild variant="link" className="underline xl:px-0">
          <Link
            href={`/agenda/${lesson.id}/planejamento`}
            aria-label={`Planejamento da aula de ${student} às ${start}`}
          >
            Plano
          </Link>
        </Button>
        {(editable || lesson.recurrence_id) && (
          <Button asChild variant="link" className="underline xl:px-0">
            <Link
              href={`/agenda/${lesson.id}/editar`}
              aria-label={`Editar aula de ${student} às ${start}`}
            >
              Editar
            </Link>
          </Button>
        )}
        {!cancelled && online && lesson.meeting_url && (
          <Button asChild variant="link" className="underline xl:px-0">
            <a
              href={lesson.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir Meet da aula de ${student} às ${start} (nova aba)`}
            >
              Meet
            </a>
          </Button>
        )}
      </div>
      {(lesson.hasNote ||
        lesson.status === "realizada" ||
        lesson.status === "agendada" ||
        lesson.status === "confirmada") && (
        <Button
          asChild
          variant="outline"
          className="h-auto w-full whitespace-normal px-1 text-center"
        >
          <Link href={`/agenda/${lesson.id}/registro`}>
            <span className="sr-only">
              {student}, {start}:{" "}
            </span>
            {lesson.hasNote
              ? "Ver registro"
              : lesson.status === "realizada"
                ? "Registrar aula"
                : "Marcar realizada"}
          </Link>
        </Button>
      )}
      {lesson.rescheduled_from_id && (
        <p className="text-xs">Aula de reposição</p>
      )}
      <OccurrenceActions lesson={lesson} canChangeStatus={!editable} />
    </li>
  );
}

export function WeeklyAgenda({
  days,
  today,
  lessons,
  timeZone,
}: {
  days: string[];
  today: string;
  lessons: WeekLesson[];
  timeZone: string;
}) {
  const byDay = Map.groupBy(lessons, ({ starts_at }) =>
    localLessonDateTime(new Date(starts_at), timeZone).slice(0, 10),
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 xl:gap-1">
      {days.map((date) => {
        const dayLessons = byDay.get(date) ?? [];
        const isToday = date === today;

        return (
          <section
            key={date}
            aria-labelledby={`dia-${date}`}
            className={cn(
              "min-w-0 rounded-xl border bg-muted/35",
              isToday && "border-mustard",
            )}
          >
            <h2
              id={`dia-${date}`}
              className={cn(
                "flex flex-wrap items-center justify-between gap-x-2 rounded-t-xl px-3 py-2.5 text-sm font-bold xl:block",
                isToday && "bg-accent text-accent-foreground",
              )}
            >
              <time dateTime={date} aria-current={isToday ? "date" : undefined}>
                <span className="capitalize">
                  {formatCalendarDay(date, { weekday: "long" }).split("-")[0]}
                </span>
                <span className="ml-2 font-normal xl:ml-0 xl:block">
                  {formatCalendarDay(date, {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </time>
              {isToday && <span className="font-normal xl:sr-only">Hoje</span>}
            </h2>
            {dayLessons.length ? (
              <ul className="grid gap-2 px-2 pt-2 pb-2 xl:px-0.5">
                {dayLessons.map((lesson) => (
                  <LessonCard
                    timeZone={timeZone}
                    key={lesson.id}
                    lesson={lesson}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-3 pb-3 text-sm text-muted-foreground">
                Sem aulas
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
