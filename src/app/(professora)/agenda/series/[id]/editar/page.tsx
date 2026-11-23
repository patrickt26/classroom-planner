import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { getCatalogOptions } from "@/features/catalog/queries";
import { localLessonDateTime } from "@/features/lessons/calendar";
import { ActionForm } from "@/features/recurrences/action-form";
import { endRecurrence } from "@/features/recurrences/actions";
import { getActiveRecurrence } from "@/features/recurrences/queries";
import { RecurrenceForm } from "@/features/recurrences/recurrence-form";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export const metadata = { title: "Editar série | Agenda" };

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  const { time_zone } = await requireTeacherWorkspace();
  const today = localLessonDateTime(new Date(), time_zone).slice(0, 10);
  const row = await getActiveRecurrence(id.data, today);
  if (!row) notFound();
  const subjects = await getCatalogOptions(
    "subjects",
    row.subject_id ? [row.subject_id] : [],
  );

  return (
    <div className="grid max-w-2xl gap-5">
      <header>
        <h1 className="text-3xl font-bold text-brown">Editar série</h1>
        <p className="mt-1 wrap-anywhere font-semibold">{row.students?.name}</p>
      </header>
      <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-6">
        <p>
          As alterações se aplicam às próximas aulas agendadas ou confirmadas da
          série.
        </p>
        <RecurrenceForm row={row} subjects={subjects} />
        <details className="border-t pt-2">
          <summary className="min-h-11 cursor-pointer py-2.5 font-semibold">
            Encerrar série
          </summary>
          <ActionForm
            action={endRecurrence.bind(null, row.id)}
            label="Confirmar encerramento"
          >
            <p>
              As próximas aulas agendadas ou confirmadas serão removidas. O
              histórico fica na agenda.
            </p>
          </ActionForm>
        </details>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/agenda">Voltar para a agenda</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/alunos/${row.student_id}`}>Ver ficha do aluno</Link>
        </Button>
      </div>
    </div>
  );
}
