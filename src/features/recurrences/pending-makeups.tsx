import {
  formatCalendarDay,
  localLessonDateTime,
} from "@/features/lessons/calendar";
import { ActionForm } from "./action-form";
import { scheduleMakeup } from "./actions";
import { MakeupDateFields } from "./makeup-date-fields";
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
          const originalStart = new Date(row.starts_at);
          const [date, time] = localLessonDateTime(
            originalStart,
            timeZone,
          ).split("T");
          const milliseconds = originalStart.getUTCMilliseconds();
          const originalTime = milliseconds
            ? `${time}.${String(milliseconds).padStart(3, "0")}`
            : time.endsWith(":00")
              ? time.slice(0, 5)
              : time;
          return (
            <article key={row.id} className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold">
                {row.students?.name} · {row.subjects?.name}
              </h3>
              <p className="text-sm">
                Aula original de{" "}
                {formatCalendarDay(date, { dateStyle: "short" })} às{" "}
                {originalTime}
              </p>
              <details>
                <summary className="min-h-11 cursor-pointer py-2.5">
                  Agendar reposição
                </summary>
                <ActionForm
                  action={scheduleMakeup.bind(null, row.id)}
                  label="Salvar reposição"
                >
                  <MakeupDateFields
                    id={row.id}
                    originalDate={date}
                    originalTime={originalTime}
                    today={today}
                    timeZone={timeZone}
                  />
                </ActionForm>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
