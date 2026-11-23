import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { lessonStatusLabels } from "@/features/lessons/form-state";
import { eventTypeSchema, listStudentTimeline } from "../queries";

const eventLabels = {
  aula: "Aula",
  registro: "Registro pós-aula",
  falta: "Falta",
  reposicao: "Reposição",
};

export async function StudentTimeline({
  studentId,
  params,
  timeZone,
}: {
  studentId: string;
  params: Record<string, string | string[] | undefined>;
  timeZone: string;
}) {
  const { events, filters, hasNextPage } = await listStudentTimeline(
    studentId,
    params,
  );
  const dateFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
  const baseHref = `/alunos/${studentId}`;

  function pageHref(page: number) {
    const query = new URLSearchParams({ historico: String(page) });
    if (filters.tipo) query.set("tipo", filters.tipo);
    return `${baseHref}?${query}#linha-do-tempo`;
  }

  return (
    <section
      aria-labelledby="linha-do-tempo"
      className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-5"
    >
      <h2
        id="linha-do-tempo"
        className="scroll-mt-4 text-xl font-bold text-brown"
      >
        Linha do tempo
      </h2>
      <form
        action={`${baseHref}#linha-do-tempo`}
        className="grid items-end gap-2 min-[480px]:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div className="grid gap-1">
          <label htmlFor="timeline-type" className="text-sm font-semibold">
            Tipo de atividade
          </label>
          <Select
            id="timeline-type"
            name="tipo"
            key={filters.tipo ?? ""}
            defaultValue={filters.tipo ?? ""}
          >
            <option value="">Todos os tipos</option>
            {eventTypeSchema.options.map((type) => (
              <option key={type} value={type}>
                {eventLabels[type]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>
      {events.length ? (
        <ol className="grid gap-4 border-l pl-4">
          {events.map((event) => {
            const type = eventTypeSchema.safeParse(event.event_type);
            if (!type.success || !event.occurred_at || !event.lesson_id) {
              return null;
            }
            return (
              <li
                key={`${type.data}-${event.lesson_id}`}
                className="relative min-w-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card bg-mustard"
                />
                <p className="text-sm text-muted-foreground">
                  <time dateTime={event.occurred_at}>
                    {dateFormat.format(new Date(event.occurred_at))}
                  </time>
                </p>
                <h3 className="mt-0.5 wrap-anywhere font-semibold">
                  {eventLabels[type.data]}
                  {event.subject_name && ` · ${event.subject_name}`}
                </h3>
                {event.status && event.status !== "falta" && (
                  <p className="text-sm text-muted-foreground">
                    {lessonStatusLabels[event.status]}
                  </p>
                )}
                {type.data === "registro" && (
                  <>
                    <p className="line-clamp-3 wrap-anywhere text-sm">
                      {event.summary}
                    </p>
                    <Link
                      className="inline-flex min-h-11 items-center text-sm font-semibold underline"
                      href={`/agenda/${event.lesson_id}/registro`}
                    >
                      Ver registro
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma atividade encontrada.
        </p>
      )}
      {(filters.historico > 1 || hasNextPage) && (
        <nav
          aria-label="Paginação da linha do tempo"
          className="flex flex-wrap items-center gap-2 border-t pt-3"
        >
          {filters.historico > 1 && (
            <Button asChild variant="outline">
              <Link href={pageHref(filters.historico - 1)}>Anterior</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Página {filters.historico}
          </span>
          {hasNextPage && (
            <Button asChild variant="outline">
              <Link href={pageHref(filters.historico + 1)}>Próxima</Link>
            </Button>
          )}
        </nav>
      )}
    </section>
  );
}
