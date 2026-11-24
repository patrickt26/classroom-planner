import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  agendaDateSchema,
  firstAgendaDate,
} from "@/features/lessons/agenda-schema";
import {
  addDays,
  agendaHref,
  localLessonDateTime,
  weekStart,
} from "@/features/lessons/calendar";
import { WeeklyAgenda } from "@/features/lessons/components/weekly-agenda";
import {
  listAgendaStudents,
  listWeekLessons,
} from "@/features/lessons/queries";
import { PendingMakeups } from "@/features/recurrences/pending-makeups";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

const weekFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const notices = {
  reposicao: "Reposição agendada.",
  salva: "Aula salva.",
  "dias-salvos": "Todos os dias foram agendados.",
  "dias-conflito": "Todos os dias foram agendados. Há aulas no mesmo horário.",
  conflito: "Aula salva. Há outra aula no mesmo horário.",
  cancelada: "Aula cancelada.",
  excluida: "Aula excluída.",
  "serie-salva": "Série salva.",
  "serie-conflito": "Série salva. A primeira aula coincide com outra aula.",
  "serie-encerrada": "Série encerrada.",
};
const noticeSchema = z.enum([
  "salva",
  "dias-salvos",
  "dias-conflito",
  "conflito",
  "cancelada",
  "reposicao",
  "excluida",
  "serie-salva",
  "serie-conflito",
  "serie-encerrada",
]);

export const metadata = { title: "Agenda | Planejamento de aulas" };

function clampAgendaDate(date: string) {
  if (date < firstAgendaDate) return firstAgendaDate;
  return date;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    semana?: string | string[];
    aviso?: string | string[];
    aluno?: string | string[];
  }>;
}) {
  const { time_zone, week_start } = await requireTeacherWorkspace();
  const params = await searchParams;
  const today = localLessonDateTime(new Date(), time_zone).slice(0, 10);
  const date = agendaDateSchema.catch(today).parse(params.semana);
  const week = weekStart(date, week_start);
  const currentWeek = week === weekStart(today, week_start);
  const firstDay = clampAgendaDate(week);
  const weekEnd = addDays(week, 6);
  const previous = addDays(week, -7);
  const next = addDays(week, 7);
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(week, index),
  ).filter((day) => day >= firstDay);
  const studentFilter = z.uuid().safeParse(params.aluno);
  const requestedStudent = studentFilter.data?.toLowerCase();
  const students = await listAgendaStudents();
  const studentId = students.find(({ id }) => id === requestedStudent)?.id;
  const lessons = await listWeekLessons(firstDay, next, studentId);
  const notice = noticeSchema.safeParse(params.aviso);

  return (
    <div data-wide-content="" className="grid min-w-0 gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-brown">Agenda</h1>
        <Button asChild className="px-4">
          <Link href={`/agenda/nova?data=${currentWeek ? today : firstDay}`}>
            <Plus aria-hidden="true" /> Nova aula
          </Link>
        </Button>
      </header>
      {notice.success && (
        <Alert
          variant={notice.data.endsWith("conflito") ? "info" : "success"}
          message={notices[notice.data]}
        />
      )}
      <nav
        aria-label="Semanas da agenda"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-2 sm:px-3"
      >
        <div className="flex flex-1 items-center justify-between gap-2 sm:justify-start">
          {week > firstAgendaDate && (
            <Button asChild variant="outline" size="icon">
              <Link
                href={agendaHref(
                  clampAgendaDate(previous),
                  undefined,
                  studentId,
                )}
                aria-label="Semana anterior"
              >
                <ChevronLeft aria-hidden="true" />
              </Link>
            </Button>
          )}
          <p className="text-center text-sm font-semibold sm:min-w-52">
            {weekFormatter.formatRange(new Date(firstDay), new Date(weekEnd))}
          </p>
          {agendaDateSchema.safeParse(next).success && (
            <Button asChild variant="outline" size="icon">
              <Link
                href={agendaHref(next, undefined, studentId)}
                aria-label="Próxima semana"
              >
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
        {!currentWeek && (
          <Button
            asChild
            variant="outline"
            className="basis-full sm:basis-auto"
          >
            <Link href={agendaHref(undefined, undefined, studentId)}>
              Semana atual
            </Link>
          </Button>
        )}
      </nav>
      <Form action="/agenda" className="grid gap-2 sm:max-w-sm">
        <input type="hidden" name="semana" value={firstDay} />
        <label htmlFor="agenda-student" className="text-sm font-semibold">
          Filtrar por aluno
        </label>
        <div className="flex gap-2">
          <Select
            key={`${week}:${studentId ?? ""}`}
            id="agenda-student"
            name="aluno"
            defaultValue={studentId ?? ""}
          >
            <option value="">Todos os alunos</option>
            {students.map(({ id, name, archived_at }) => (
              <option key={id} value={id}>
                {name}
                {archived_at && " (arquivado)"}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </div>
      </Form>
      <WeeklyAgenda
        timeZone={time_zone}
        days={days}
        today={today}
        lessons={lessons}
      />
      <PendingMakeups timeZone={time_zone} today={today} />
    </div>
  );
}
