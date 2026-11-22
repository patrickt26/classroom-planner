import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { saveLessonNote } from "@/features/lesson-notes/actions";
import { LessonNoteForm } from "@/features/lesson-notes/components/lesson-note-form";
import { getLessonNotes } from "@/features/lesson-notes/queries";
import {
  type LessonNoteValues,
  lessonNoteFields,
} from "@/features/lesson-notes/schema";
import { agendaHref, localLessonDateTime } from "@/features/lessons/calendar";

export const metadata = { title: "Registro pós-aula | Agenda" };

const emptyNote: LessonNoteValues = {
  worked_on: "",
  difficulties: "",
  next_steps: "",
};

function NoteContent({ note }: { note: LessonNoteValues }) {
  return (
    <dl className="grid gap-4">
      {lessonNoteFields.map(({ name, label }) => (
        <div key={name}>
          <dt className="text-sm font-semibold">{label}</dt>
          <dd className="mt-1 wrap-anywhere whitespace-pre-wrap">
            {note[name] || "Sem registro"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function LessonNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string; salvo?: string; conflito?: string }>;
}) {
  const { id } = await params;
  const { editar, salvo, conflito } = await searchParams;
  const { lesson, notes, timeZone } = await getLessonNotes(id);
  const [current, ...history] = notes;
  const noteHref = `/agenda/${id}/registro`;
  const startsAt = new Date(lesson.starts_at);
  const agenda = agendaHref(
    localLessonDateTime(startsAt, timeZone).slice(0, 10),
  );
  const markingDone =
    lesson.status === "agendada" || lesson.status === "confirmada";
  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  });

  return (
    <div className="grid max-w-5xl gap-5">
      <header className="grid gap-2">
        <Button asChild variant="outline" className="w-fit">
          <Link href={agenda}>Voltar para a agenda</Link>
        </Button>
        <h1 className="text-3xl font-bold text-brown">Registro pós-aula</h1>
        <p className="wrap-anywhere">
          {[lesson.students?.name, lesson.subjects?.name]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="text-sm text-muted-foreground">
          <time dateTime={lesson.starts_at}>{dateTime.format(startsAt)}</time>
        </p>
      </header>
      {conflito === "1" && (
        <Alert
          variant="info"
          message="Aula salva. Há outra aula no mesmo horário."
        />
      )}
      {salvo === "1" && current && editar !== "1" && (
        <Alert variant="success" message="Registro salvo." />
      )}
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {!current || editar === "1" ? (
          <LessonNoteForm
            key={current?.id ?? "new"}
            action={saveLessonNote.bind(null, id, current?.id ?? null)}
            initialValues={current ?? emptyNote}
            backHref={current ? noteHref : agenda}
            submitLabel={
              current
                ? "Salvar nova versão"
                : markingDone
                  ? "Marcar realizada e salvar"
                  : "Salvar registro"
            }
          />
        ) : (
          <section className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="text-xl font-bold text-brown">Versão atual</h2>
            <p className="text-sm text-muted-foreground">
              <time dateTime={current.created_at}>
                {dateTime.format(new Date(current.created_at))}
              </time>
            </p>
            <NoteContent note={current} />
            <Button asChild className="w-full sm:w-fit">
              <Link href={`${noteHref}?editar=1`}>Editar registro</Link>
            </Button>
          </section>
        )}
        {history.length > 0 && (
          <section className="grid min-w-0 gap-3 rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="text-xl font-bold text-brown">Versões anteriores</h2>
            {history.map((note, index) => (
              <details key={note.id} className="rounded-lg border">
                <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold">
                  Versão {history.length - index} ·{" "}
                  <time dateTime={note.created_at}>
                    {dateTime.format(new Date(note.created_at))}
                  </time>
                </summary>
                <div className="border-t px-3 py-3">
                  <NoteContent note={note} />
                </div>
              </details>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
