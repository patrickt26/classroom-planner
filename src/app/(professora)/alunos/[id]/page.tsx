import { CalendarPlus, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { z } from "zod";
import { Alert, type FormFeedback } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getPendingCharges } from "@/features/charges/queries";
import { StudentGuardians } from "@/features/guardians/components/student-guardians";
import { listLessonsWithoutNotes } from "@/features/lesson-notes/queries";
import { localLessonDateTime } from "@/features/lessons/calendar";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { listStudentRecurrences } from "@/features/recurrences/queries";
import { weeklySchedule } from "@/features/recurrences/schedule";
import {
  BackToStudents,
  GuardianConsentForm,
} from "@/features/students/components/student-form";
import { formatReais } from "@/features/students/form-state";
import { getStudent } from "@/features/students/queries";
import { StudentTimeline } from "@/features/timeline/components/student-timeline";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Ficha do aluno | Planejamento de aulas" };

const noticeSchema = z.enum([
  "aula-salva",
  "aula-conflito",
  "pagamento-registrado",
]);
const notices = {
  "aula-salva": { variant: "success", message: "Agendamento salvo." },
  "aula-conflito": {
    variant: "info",
    message: "Agendamento salvo com conflito de horário.",
  },
  "pagamento-registrado": {
    variant: "success",
    message: "Pagamento registrado.",
  },
} as const satisfies Record<z.infer<typeof noticeSchema>, FormFeedback>;

const birthDateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 wrap-anywhere font-semibold">{children}</dd>
    </div>
  );
}

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const student = await getStudent((await params).id);
  const filters = await searchParams;
  const { workspace_id, time_zone } = await requireTeacherWorkspace();
  const today = localLessonDateTime(new Date(), time_zone).slice(0, 10);
  const [series, pendingNotes, [pendingPayments]] = await Promise.all([
    listStudentRecurrences(student.id, today),
    listLessonsWithoutNotes(workspace_id, student.id),
    getPendingCharges(workspace_id, time_zone, student.id),
  ]);
  const noteDateTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: time_zone,
  });
  const notice = noticeSchema.safeParse(filters.aviso).data;
  const subjects = student.student_subjects
    .flatMap(({ subjects }) => (subjects ? [subjects.name] : []))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const archived = student.archived_at !== null;

  return (
    <div className="grid gap-6">
      <header>
        <BackToStudents
          href={archived ? "/alunos?situacao=arquivados" : "/alunos"}
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="wrap-anywhere text-3xl font-bold text-brown">
              {student.name}
            </h1>
            {archived && (
              <p className="mt-1 text-sm text-muted-foreground">
                Aluno arquivado
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!archived && (
              <Button asChild>
                <Link href={`/agenda/nova?aluno=${student.id}`}>
                  <CalendarPlus aria-hidden="true" /> Agendar aula
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/alunos/${student.id}/editar`}>
                <Pencil aria-hidden="true" /> Editar aluno
              </Link>
            </Button>
          </div>
        </div>
      </header>
      {notice && <Alert {...notices[notice]} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="grid min-w-0 gap-6">
          {pendingNotes.length > 0 && (
            <section
              aria-labelledby="registros-pendentes"
              className="grid gap-2 rounded-xl border bg-card p-4 sm:p-5"
            >
              <h2
                id="registros-pendentes"
                className="text-xl font-bold text-brown"
              >
                Registros pendentes
              </h2>
              <ul className="divide-y">
                {pendingNotes.map((lesson) => {
                  const date = noteDateTime.format(new Date(lesson.starts_at));
                  return (
                    <li
                      key={lesson.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
                    >
                      <div className="min-w-0 wrap-anywhere">
                        <p className="font-semibold">{lesson.subjects.name}</p>
                        <time
                          dateTime={lesson.starts_at}
                          className="text-sm text-muted-foreground"
                        >
                          {date}
                        </time>
                      </div>
                      <Button asChild variant="outline">
                        <Link
                          href={`/agenda/${lesson.id}/registro`}
                          prefetch={false}
                        >
                          Registrar
                          <span className="sr-only">
                            {" "}
                            aula de {lesson.subjects.name} em {date}
                          </span>
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {pendingPayments && (
            <section
              aria-labelledby="pagamentos-pendentes"
              className="grid gap-3 rounded-xl border bg-card p-4 sm:p-5"
            >
              <h2
                id="pagamentos-pendentes"
                className="text-xl font-bold text-brown"
              >
                Pagamentos pendentes
              </h2>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {pendingPayments.charges.length === 1
                    ? "1 aula pendente"
                    : `${pendingPayments.charges.length} aulas pendentes`}
                </p>
                <strong className="tabular-nums">
                  {formatReais.format(
                    pendingPayments.charges.reduce(
                      (sum, charge) => sum + charge.amount,
                      0,
                    ) / 100,
                  )}
                </strong>
              </div>
              <PaymentForm
                key={pendingPayments.charges
                  .map(({ lessonId }) => lessonId)
                  .join(",")}
                id={student.id}
                name={student.name}
                charges={pendingPayments.charges}
                today={today}
                fromStudentPage
              />
            </section>
          )}
          <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-xl font-bold text-brown">Dados do aluno</h2>
            <dl className="grid gap-4">
              {student.grades && (
                <Detail label="Ano escolar">{student.grades.name}</Detail>
              )}
              {student.school && (
                <Detail label="Escola">{student.school}</Detail>
              )}
              {student.birth_date && (
                <Detail label="Data de nascimento">
                  <time dateTime={student.birth_date}>
                    {birthDateFormat.format(new Date(student.birth_date))}
                  </time>
                </Detail>
              )}
              {subjects.length > 0 && (
                <Detail label="Disciplinas">{subjects.join(", ")}</Detail>
              )}
              <Detail label="Valor por hora">
                {student.is_free
                  ? "Gratuito"
                  : formatReais.format(student.hourly_rate / 100)}
              </Detail>
              {student.notes && (
                <Detail label="Observações">
                  <span className="whitespace-pre-wrap">{student.notes}</span>
                </Detail>
              )}
            </dl>
            {student.guardian_consent_at ? (
              <p className="text-sm text-muted-foreground">
                Autorização registrada em{" "}
                <time dateTime={student.guardian_consent_at}>
                  {new Date(student.guardian_consent_at).toLocaleDateString(
                    "pt-BR",
                    {
                      timeZone: time_zone,
                    },
                  )}
                </time>
              </p>
            ) : (
              <GuardianConsentForm studentId={student.id} />
            )}
          </section>
        </div>

        <div className="grid gap-6">
          <StudentTimeline
            studentId={student.id}
            params={filters}
            timeZone={time_zone}
          />
          <section className="grid gap-2 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-xl font-bold text-brown">Séries ativas</h2>
            {series.length ? (
              <ul className="divide-y">
                {series.map((row) => (
                  <li key={row.id}>
                    <Link
                      className="flex min-h-11 items-center py-2 text-sm font-semibold underline"
                      href={`/agenda/series/${row.id}/editar`}
                    >
                      {weeklySchedule(row.day_of_week, row.start_time)}
                      {row.subjects && ` · ${row.subjects.name}`}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma série ativa.
              </p>
            )}
          </section>
          <StudentGuardians studentId={student.id} params={filters} />
        </div>
      </div>
    </div>
  );
}
