import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { localLessonDateTime } from "@/features/lessons/calendar";
import { getLessonOptions } from "@/features/lessons/queries";
import { ActionForm } from "@/features/recurrences/action-form";
import { endRecurrence } from "@/features/recurrences/actions";
import { listRecurrences } from "@/features/recurrences/queries";
import {
  RecurrenceForm,
  weekdays,
} from "@/features/recurrences/recurrence-form";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Recorrências | Agenda" };
export default async function RecurrencesPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const ws = await requireTeacherWorkspace();
  const today = localLessonDateTime(new Date(), ws.time_zone).slice(0, 10);
  const [options, rows, { aviso }] = await Promise.all([
    getLessonOptions(),
    listRecurrences(today),
    searchParams,
  ]);
  const props = { ...options, today, timeZone: ws.time_zone };
  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold text-brown">Recorrências</h1>
        <Button asChild variant="outline">
          <Link href="/agenda">Voltar à agenda</Link>
        </Button>
      </header>
      {aviso === "salva" || aviso === "encerrada" ? (
        <Alert
          variant="success"
          message={
            aviso === "salva" ? "Recorrência salva." : "Recorrência encerrada."
          }
        />
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <h2 className="text-xl font-bold text-brown">Nova recorrência</h2>
          {options.students.length && options.subjects.length ? (
            <RecurrenceForm {...props} />
          ) : (
            <p>
              Cadastre um aluno ativo e uma disciplina para criar uma
              recorrência.
            </p>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brown">Recorrências ativas</h2>
          {!rows.length && <p>Nenhuma recorrência ativa.</p>}
          {rows.map((r) => (
            <article
              className="grid gap-2 rounded-xl border bg-card p-4"
              key={r.id}
            >
              <h3 className="font-semibold">
                {r.students?.name} · {r.subjects?.name}
              </h3>
              <p>
                {weekdays[r.day_of_week]}, {r.start_time.slice(0, 5)} ·{" "}
                {r.duration_minutes} min
              </p>
              <details>
                <summary className="min-h-11 cursor-pointer py-2.5 font-medium">
                  Editar recorrência
                </summary>
                <RecurrenceForm {...props} row={r} />
              </details>
              <details>
                <summary className="min-h-11 cursor-pointer py-2.5 font-medium">
                  Encerrar recorrência
                </summary>
                <ActionForm
                  action={endRecurrence.bind(null, r.id)}
                  label="Confirmar encerramento"
                >
                  <p>
                    As próximas aulas agendadas ou confirmadas desta série serão
                    removidas. As aulas passadas ficam no histórico.
                  </p>
                </ActionForm>
              </details>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
