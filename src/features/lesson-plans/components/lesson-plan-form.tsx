"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { LessonPlanState, LessonPlanValues } from "../schema";

const fields = [
  { name: "objective", label: "Objetivo", limit: 2000, rows: 3 },
  { name: "content", label: "Conteúdo", limit: 4000, rows: 3 },
  { name: "activities", label: "Atividades", limit: 4000, rows: 4 },
  { name: "materials", label: "Materiais e links", limit: 4000, rows: 4 },
] as const;

export function LessonPlanForm({
  action,
  initialValues,
}: {
  action: (
    previous: LessonPlanState,
    form: FormData,
  ) => Promise<LessonPlanState>;
  initialValues: LessonPlanValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initialValues,
    attempt: 0,
  });

  return (
    <form
      action={submit}
      className="grid gap-5 rounded-xl border bg-card p-4 sm:p-6"
    >
      <Alert variant="error" message={state.message} />
      <fieldset
        key={state.attempt}
        disabled={pending}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        {fields.map(({ name, label, limit, rows }) => (
          <div key={name} className="grid min-w-0 gap-1.5">
            <label htmlFor={name} className="text-sm font-semibold">
              {label}
              {name !== "objective" && (
                <span className="ml-1 font-normal text-muted-foreground">
                  (opcional)
                </span>
              )}
            </label>
            <textarea
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id={name}
              name={name}
              rows={rows}
              maxLength={limit}
              required={name === "objective"}
              defaultValue={state.values[name]}
            />
          </div>
        ))}
      </fieldset>
      <Button type="submit" disabled={pending} className="w-full sm:w-fit">
        {pending ? "Salvando…" : "Salvar plano"}
      </Button>
    </form>
  );
}
