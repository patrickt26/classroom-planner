import { Video } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addDays,
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

  return (
    <li className="min-w-0 rounded-lg border bg-card">
      <div className="space-y-1.5 px-3 pt-3 lg:px-2">
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
        <p className="text-sm text-muted-foreground">
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
      <div className="flex flex-wrap gap-x-1 px-1 lg:gap-x-0">
        <Button asChild variant="link" className="underline lg:px-1">
          <Link
            href={`/agenda/${lesson.id}/planejamento`}
            aria-label={`Planejamento da aula de ${student} às ${start}`}
          >
            Plano
          </Link>
        </Button>
        {(editable || lesson.recurrence_id) && (
          <Button asChild variant="link" className="underline lg:px-1">
            <Link
              href={`/agenda/${lesson.id}/editar`}
              aria-label={`Editar aula de ${student} às ${start}`}
            >
              Editar
            </Link>
          </Button>
        )}
        {!cancelled && lesson.modality === "online" && lesson.meeting_url && (
          <Button asChild variant="link" className="underline lg:px-1">
            <a
              href={lesson.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir Meet da aula de ${student} às ${start} (nova aba)`}
            >
              <Video aria-hidden="true" /> Meet
            </a>
          </Button>
        )}
      </div>
      {lesson.rescheduled_from_id && (
        <p className="px-2 pb-2 text-xs">Aula de reposição</p>
      )}
      <OccurrenceActions lesson={lesson} canChangeStatus={!editable} />
    </li>
  );
}

export function WeeklyAgenda({
  week,
  today,
  lessons,
  timeZone,
}: {
  week: string;
  today: string;
  lessons: WeekLesson[];
  timeZone: string;
}) {
  const byDay = Map.groupBy(lessons, ({ starts_at }) =>
    localLessonDateTime(new Date(starts_at), timeZone).slice(0, 10),
  );

  return (
    <div className="grid gap-3 lg:grid-cols-7 lg:gap-2">
      {Array.from({ length: 7 }, (_, index) => {
        const date = addDays(week, index);
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
                "flex flex-wrap items-center justify-between gap-x-2 rounded-t-xl px-3 py-2.5 text-sm font-bold lg:block lg:px-2",
                isToday && "bg-accent text-accent-foreground",
              )}
            >
              <time dateTime={date} aria-current={isToday ? "date" : undefined}>
                <span className="capitalize">
                  {formatCalendarDay(date, { weekday: "long" }).split("-")[0]}
                </span>
                <span className="ml-2 font-normal lg:ml-0 lg:block">
                  {formatCalendarDay(date, {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </time>
              {isToday && <span className="font-normal lg:sr-only">Hoje</span>}
            </h2>
            {dayLessons.length ? (
              <ul className="grid gap-2 px-2 pb-2 lg:px-1.5">
                {dayLessons.map((lesson) => (
                  <LessonCard
                    timeZone={timeZone}
                    key={lesson.id}
                    lesson={lesson}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-3 pb-3 text-sm text-muted-foreground lg:px-2">
                Sem aulas
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
