import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  RotateCcw,
  Video,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPendingChargeTotal } from "@/features/charges/queries";
import { listLessonsWithoutNotes } from "@/features/lesson-notes/queries";
import {
  formatCalendarDay,
  formatLessonTime,
  localLessonDateTime,
} from "@/features/lessons/calendar";
import {
  lessonModalityLabels,
  lessonStatusLabels,
} from "@/features/lessons/form-state";
import { type DayLesson, listDayLessons } from "@/features/lessons/queries";
import { countPendingMakeups } from "@/features/recurrences/queries";
import { formatReais } from "@/features/students/form-state";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { cn } from "@/lib/utils";

function TodayLesson({
  lesson,
  timeZone,
}: {
  lesson: DayLesson;
  timeZone: string;
}) {
  const startsAt = new Date(lesson.starts_at);
  const endsAt = new Date(
    startsAt.getTime() + lesson.duration_minutes * 60_000,
  );
  const startTime = formatLessonTime(startsAt, timeZone);
  const student = lesson.students.name;
  const upcoming =
    lesson.status === "agendada" || lesson.status === "confirmada";
  const noteLabel = lesson.hasNote
    ? "Ver registro"
    : upcoming || lesson.status === "realizada"
      ? "Registrar aula"
      : null;

  return (
    <li className="grid gap-2 px-4 py-3 lg:grid-cols-[7rem_minmax(0,1fr)] lg:gap-x-3">
      <p className="text-sm font-semibold tabular-nums lg:pt-0.5">
        <time dateTime={lesson.starts_at}>{startTime}</time>
        {" – "}
        <time dateTime={endsAt.toISOString()}>
          {formatLessonTime(endsAt, timeZone)}
        </time>
      </p>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="wrap-anywhere font-semibold">{student}</h3>
          <Badge
            variant={lesson.status === "confirmada" ? "secondary" : "outline"}
          >
            {lessonStatusLabels[lesson.status]}
          </Badge>
        </div>
        <p className="mt-0.5 wrap-anywhere text-sm text-muted-foreground">
          {lesson.subjects.name} · {lessonModalityLabels[lesson.modality]}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 empty:hidden">
          {upcoming && lesson.modality === "online" && lesson.meeting_url && (
            <Button asChild>
              <a
                href={lesson.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video aria-hidden="true" /> Abrir Meet
                <span className="sr-only">
                  {" "}
                  da aula de {student} às {startTime} (nova aba)
                </span>
              </a>
            </Button>
          )}
          {noteLabel && (
            <Button asChild variant="outline">
              <Link prefetch={false} href={`/agenda/${lesson.id}/registro`}>
                {noteLabel}
                <span className="sr-only">
                  {" "}
                  de {student} às {startTime}
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export async function TodayPage() {
  const { workspace_id, time_zone } = await requireTeacherWorkspace();
  const date = localLessonDateTime(new Date(), time_zone).slice(0, 10);
  const [lessons, pendingNotes, pendingMakeups, pendingTotal] =
    await Promise.all([
      listDayLessons(workspace_id, date, time_zone),
      listLessonsWithoutNotes(workspace_id),
      countPendingMakeups(workspace_id),
      getPendingChargeTotal(workspace_id),
    ]);
  const hasLessons = lessons.length > 0 || pendingNotes.length > 0;
  const hasSummary = pendingMakeups > 0 || pendingTotal > 0;
  const noteDateTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: time_zone,
  });

  return (
    <div className="grid gap-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-brown">Hoje</h1>
        <p className="text-muted-foreground first-letter:uppercase">
          <time dateTime={date}>
            {formatCalendarDay(date, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </time>
        </p>
      </header>
      <div
        className={cn(
          "grid items-start gap-5",
          hasLessons && hasSummary
            ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
            : "max-w-2xl",
        )}
      >
        {hasLessons && (
          <div className="grid min-w-0 gap-5">
            {lessons.length > 0 && (
              <section
                aria-labelledby="aulas-hoje"
                className="overflow-hidden rounded-xl border bg-card"
              >
                <h2
                  id="aulas-hoje"
                  className="flex items-center gap-2 border-b bg-muted/35 px-4 py-3 text-lg font-bold text-brown"
                >
                  <CalendarDays
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                  Aulas do dia
                </h2>
                <ul className="divide-y">
                  {lessons.map((lesson) => (
                    <TodayLesson
                      key={lesson.id}
                      lesson={lesson}
                      timeZone={time_zone}
                    />
                  ))}
                </ul>
              </section>
            )}
            {pendingNotes.length > 0 && (
              <section
                aria-labelledby="registros-pendentes"
                className="overflow-hidden rounded-xl border bg-card"
              >
                <h2
                  id="registros-pendentes"
                  className="flex items-center gap-2 border-b bg-muted/35 px-4 py-3 text-lg font-bold text-brown"
                >
                  <ClipboardList
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                  Registros pós-aula pendentes
                </h2>
                <ul className="divide-y">
                  {pendingNotes.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        prefetch={false}
                        href={`/agenda/${lesson.id}/registro`}
                        className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      >
                        <div className="min-w-0">
                          <p className="wrap-anywhere font-semibold">
                            {lesson.students.name}
                          </p>
                          <p className="wrap-anywhere text-sm text-muted-foreground">
                            {lesson.subjects.name} ·{" "}
                            <time dateTime={lesson.starts_at}>
                              {noteDateTime.format(new Date(lesson.starts_at))}
                            </time>
                          </p>
                        </div>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
        {hasSummary && (
          <div
            className={cn(
              "grid min-w-0 gap-4 sm:grid-cols-2",
              hasLessons && "lg:grid-cols-1",
            )}
          >
            {pendingMakeups > 0 && (
              <section
                aria-labelledby="reposicoes-pendentes"
                className="grid content-start gap-2 rounded-xl border bg-card p-4"
              >
                <h2
                  id="reposicoes-pendentes"
                  className="flex items-center gap-2 text-lg font-bold text-brown"
                >
                  <RotateCcw aria-hidden="true" className="size-5 shrink-0" />
                  Reposições pendentes
                </h2>
                <p className="font-semibold">
                  {pendingMakeups}{" "}
                  {pendingMakeups === 1 ? "aula a repor" : "aulas a repor"}
                </p>
                <Button asChild variant="outline" className="w-fit">
                  <Link href="/agenda#reposicoes">
                    Ver reposições <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </section>
            )}
            {pendingTotal > 0 && (
              <section
                aria-labelledby="cobrancas-pendentes"
                className="grid content-start gap-2 rounded-xl border bg-card p-4"
              >
                <h2
                  id="cobrancas-pendentes"
                  className="flex items-center gap-2 text-lg font-bold text-brown"
                >
                  <Wallet aria-hidden="true" className="size-5 shrink-0" />
                  Cobranças a receber
                </h2>
                <p className="wrap-anywhere text-xl font-bold tabular-nums">
                  {formatReais.format(pendingTotal / 100)}
                </p>
                <Button asChild variant="outline" className="w-fit">
                  <Link href="/cobrancas">
                    Ver cobranças <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </section>
            )}
          </div>
        )}
        {!hasLessons && !hasSummary && (
          <p className="text-muted-foreground">
            Você não tem aulas hoje nem pendências.
          </p>
        )}
      </div>
    </div>
  );
}
