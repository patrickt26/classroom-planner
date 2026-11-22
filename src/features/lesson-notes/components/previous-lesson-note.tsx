import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PreviousLessonNote({
  note,
}: {
  note: { lessonId: string; difficulties: string; next_steps: string };
}) {
  return (
    <section
      aria-labelledby="previous-lesson-heading"
      className="grid min-w-0 gap-3 rounded-xl border bg-card p-4 sm:p-6"
    >
      <h2 id="previous-lesson-heading" className="text-xl font-bold text-brown">
        Da última aula
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-sm font-semibold">Próximos passos</dt>
          <dd className="mt-1 wrap-anywhere whitespace-pre-wrap">
            {note.next_steps || "Sem registro"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold">Dificuldades</dt>
          <dd className="mt-1 wrap-anywhere whitespace-pre-wrap">
            {note.difficulties || "Sem registro"}
          </dd>
        </div>
      </dl>
      <Button asChild variant="outline" className="w-full sm:w-fit">
        <Link href={`/agenda/${note.lessonId}/registro`}>
          Ver registro completo
        </Link>
      </Button>
    </section>
  );
}
