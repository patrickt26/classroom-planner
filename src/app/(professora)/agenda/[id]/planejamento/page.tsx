import Form from "next/form";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { saveLessonPlan } from "@/features/lesson-plans/actions";
import { LessonPlanForm } from "@/features/lesson-plans/components/lesson-plan-form";
import { getLessonPlanning } from "@/features/lesson-plans/queries";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";

export const metadata = { title: "Planejamento da aula | Agenda" };

export default async function LessonPlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    copiar?: string | string[];
    salvo?: string | string[];
  }>;
}) {
  const [{ id }, { copiar, salvo }] = await Promise.all([params, searchParams]);
  const { lesson, previousLessons, copy, timeZone } = await getLessonPlanning(
    id,
    copiar,
  );
  const plan = lesson.lesson_plans;
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  });
  const agenda = agendaHref(
    localLessonDateTime(new Date(lesson.starts_at), timeZone).slice(0, 10),
  );

  return (
    <div className="grid max-w-4xl gap-5">
      <header className="grid gap-1">
        <Button asChild variant="link" className="w-fit px-0 underline">
          <Link href={agenda}>Voltar para a agenda</Link>
        </Button>
        <h1 className="text-3xl font-bold text-brown">Planejamento da aula</h1>
        <p className="wrap-anywhere font-semibold">
          {lesson.students?.name} · {lesson.subjects?.name}
        </p>
        <time
          dateTime={lesson.starts_at}
          className="text-sm text-muted-foreground"
        >
          {formatter.format(new Date(lesson.starts_at))}
        </time>
      </header>
      {salvo === "1" && plan && (
        <Alert variant="success" message="Plano salvo." />
      )}
      {!!previousLessons.length && (
        <Form
          action={`/agenda/${id}/planejamento`}
          className="grid items-end gap-2 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6"
        >
          <div className="grid min-w-0 gap-1.5">
            <label htmlFor="source-plan" className="text-sm font-semibold">
              Plano anterior
            </label>
            <select
              key={copy ? String(copiar) : ""}
              id="source-plan"
              name="copiar"
              required
              defaultValue={copy ? String(copiar) : ""}
              className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione uma aula</option>
              {previousLessons.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.students?.name} · {source.subjects?.name} ·{" "}
                  {formatter.format(new Date(source.starts_at))}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Duplicar plano
          </Button>
        </Form>
      )}
      {copy && (
        <Alert
          variant="info"
          message="Revise a cópia e salve o plano desta aula."
        />
      )}
      {!plan && copiar && !copy && (
        <Alert
          variant="error"
          message="O plano escolhido não está disponível para esta aula."
        />
      )}
      <LessonPlanForm
        key={plan ? "saved" : copy ? String(copiar) : "new"}
        action={saveLessonPlan.bind(null, id, Boolean(plan))}
        initialValues={
          plan ??
          copy ?? { objective: "", content: "", activities: "", materials: "" }
        }
      />
    </div>
  );
}
