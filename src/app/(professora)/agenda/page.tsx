import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { agendaDateSchema } from "@/features/lessons/agenda-schema";
import {
  addDays,
  agendaHref,
  localLessonDateTime,
  weekStart,
} from "@/features/lessons/calendar";
import { WeeklyAgenda } from "@/features/lessons/components/weekly-agenda";
import { listWeekLessons } from "@/features/lessons/queries";
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
  conflito: "Aula salva. Há outra aula no mesmo horário.",
  cancelada: "Aula cancelada.",
  excluida: "Aula excluída.",
  "serie-salva": "Série salva.",
  "serie-conflito": "Série salva. A primeira aula coincide com outra aula.",
  "serie-encerrada": "Série encerrada.",
};
const noticeSchema = z.enum([
  "salva",
  "conflito",
  "cancelada",
  "reposicao",
  "excluida",
  "serie-salva",
  "serie-conflito",
  "serie-encerrada",
]);

export const metadata = { title: "Agenda | Planejamento de aulas" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    semana?: string | string[];
    aviso?: string | string[];
  }>;
}) {
  const { time_zone } = await requireTeacherWorkspace();
  const params = await searchParams;
  const today = localLessonDateTime(new Date(), time_zone).slice(0, 10);
  const week = weekStart(agendaDateSchema.catch(today).parse(params.semana));
  const currentWeek = week === weekStart(today);
  const weekEnd = addDays(week, 6);
  const previous = addDays(week, -7);
  const next = addDays(week, 7);
  const lessons = await listWeekLessons(week);
  const notice = noticeSchema.safeParse(params.aviso);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-brown">Agenda</h1>
        <Button asChild className="px-4">
          <Link href={`/agenda/nova?data=${currentWeek ? today : week}`}>
            <Plus aria-hidden="true" /> Nova aula
          </Link>
        </Button>
      </header>
      {notice.success && (
        <Alert
          variant={
            notice.data === "conflito" || notice.data === "serie-conflito"
              ? "info"
              : "success"
          }
          message={notices[notice.data]}
        />
      )}
      <nav
        aria-label="Semanas da agenda"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-2 sm:px-3"
      >
        <div className="flex flex-1 items-center justify-between gap-2 sm:justify-start">
          {agendaDateSchema.safeParse(previous).success && (
            <Button asChild variant="outline" size="icon">
              <Link href={agendaHref(previous)} aria-label="Semana anterior">
                <ChevronLeft aria-hidden="true" />
              </Link>
            </Button>
          )}
          <p className="text-center text-sm font-semibold sm:min-w-52">
            {weekFormatter.formatRange(new Date(week), new Date(weekEnd))}
          </p>
          {agendaDateSchema.safeParse(next).success && (
            <Button asChild variant="outline" size="icon">
              <Link href={agendaHref(next)} aria-label="Próxima semana">
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
            <Link href="/agenda">Semana atual</Link>
          </Button>
        )}
      </nav>
      <WeeklyAgenda
        timeZone={time_zone}
        week={week}
        today={today}
        lessons={lessons}
      />
      <PendingMakeups timeZone={time_zone} today={today} />
    </div>
  );
}
