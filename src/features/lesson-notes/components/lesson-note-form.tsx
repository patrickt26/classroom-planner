"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  type LessonNoteState,
  type LessonNoteValues,
  lessonNoteFields,
  lessonNoteLimit,
} from "../schema";

export function LessonNoteForm({
  action,
  initialValues,
  backHref,
  submitLabel,
}: {
  action: (
    previous: LessonNoteState,
    form: FormData,
  ) => Promise<LessonNoteState>;
  initialValues: LessonNoteValues;
  backHref: string;
  submitLabel: string;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initialValues,
    attempt: 0,
  });

  return (
    <form
      action={submit}
      className="grid gap-4 rounded-xl border bg-card p-4 sm:p-6"
    >
      <Alert variant="error" message={state.message} />
      <fieldset
        key={state.attempt}
        disabled={pending}
        className="grid min-w-0 gap-4"
      >
        <p
          id="lesson-note-privacy-hint"
          className="text-sm text-muted-foreground"
        >
          Evite registrar diagnósticos ou informações de saúde
        </p>
        {lessonNoteFields.map(({ name, label }) => (
          <div key={name} className="grid min-w-0 gap-1.5">
            <label htmlFor={name} className="text-sm font-semibold">
              {label}
              {name !== "worked_on" && (
                <span className="ml-1 font-normal text-muted-foreground">
                  (opcional)
                </span>
              )}
            </label>
            <textarea
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id={name}
              name={name}
              aria-describedby="lesson-note-privacy-hint"
              rows={2}
              maxLength={lessonNoteLimit}
              required={name === "worked_on"}
              defaultValue={state.values[name]}
            />
          </div>
        ))}
      </fieldset>
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
