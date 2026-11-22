import { Input } from "@/components/ui/input";
import {
  formatCalendarDay,
  localLessonDateTime,
} from "@/features/lessons/calendar";
import { ActionForm } from "./action-form";
import { scheduleMakeup } from "./actions";
import { listPendingMakeups } from "./queries";

export async function PendingMakeups({
  timeZone,
  today,
}: {
  timeZone: string;
  today: string;
}) {
  const pending = await listPendingMakeups();
  return (
    <section id="reposicoes" className="grid scroll-mt-4 gap-2">
      <h2 className="text-xl font-bold text-brown">Reposições pendentes</h2>
      {!pending.length && (
        <p className="text-sm text-muted-foreground">
          Nenhuma reposição pendente.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {pending.map((row) => {
          const [date, time] = localLessonDateTime(
            new Date(row.starts_at),
            timeZone,
          ).split("T");
          return (
            <article key={row.id} className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold">
                {row.students?.name} · {row.subjects?.name}
              </h3>
              <p className="text-sm">
                Aula original de{" "}
                {formatCalendarDay(date, { dateStyle: "short" })} às{" "}
                {time.slice(0, 5)}
              </p>
              <details>
                <summary className="min-h-11 cursor-pointer py-2.5">
                  Agendar reposição
                </summary>
                <ActionForm
                  action={scheduleMakeup.bind(null, row.id)}
                  label="Salvar reposição"
                >
                  <label htmlFor={`${row.id}-date`}>
                    Nova data
                    <Input
                      id={`${row.id}-date`}
                      type="date"
                      name="date"
                      required
                      defaultValue={today}
                    />
                  </label>
                  <label htmlFor={`${row.id}-time`}>
                    Novo horário ({timeZone})
                    <Input
                      id={`${row.id}-time`}
                      type="time"
                      name="time"
                      required
                      defaultValue={time.slice(0, 5)}
                    />
                  </label>
                </ActionForm>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
