import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StudentGuardians } from "@/features/guardians/components/student-guardians";
import { localLessonDateTime } from "@/features/lessons/calendar";
import { listStudentRecurrences } from "@/features/recurrences/queries";
import { weeklySchedule } from "@/features/recurrences/schedule";
import { BackToStudents } from "@/features/students/components/student-form";
import { formatReais } from "@/features/students/form-state";
import { getStudent } from "@/features/students/queries";
import { StudentTimeline } from "@/features/timeline/components/student-timeline";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Ficha do aluno | Planejamento de aulas" };

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
  const { time_zone } = await requireTeacherWorkspace();
  const today = localLessonDateTime(new Date(), time_zone).slice(0, 10);
  const series = await listStudentRecurrences(student.id, today);
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
          <Button asChild variant="outline">
            <Link href={`/alunos/${student.id}/editar`}>
              <Pencil aria-hidden="true" /> Editar aluno
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="text-xl font-bold text-brown">Dados do aluno</h2>
          <dl className="grid gap-4">
            {student.grades && (
              <Detail label="Ano escolar">{student.grades.name}</Detail>
            )}
            {student.school && <Detail label="Escola">{student.school}</Detail>}
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
        </section>

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
