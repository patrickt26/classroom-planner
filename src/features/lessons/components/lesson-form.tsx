"use client";

import Link from "next/link";
import { type ReactNode, useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { weeklySchedule } from "@/features/recurrences/schedule";
import { editableLessonStatusSchema } from "../agenda-schema";
import {
  type LessonFormState,
  type LessonFormValues,
  lessonModalityLabels,
  lessonStatusLabels,
} from "../form-state";

type Option = { id: string; name: string };
type LessonFormProps = {
  action: (
    previous: LessonFormState,
    form: FormData,
  ) => Promise<LessonFormState>;
  initialValues: LessonFormValues;
  students: Option[];
  subjects: Option[];
  backHref: string;
  timeZone: string;
  editing?: boolean;
};

const selectClass =
  "min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive md:text-sm";

function Field({
  name,
  label,
  error,
  children,
}: {
  name: keyof LessonFormValues;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-erro`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function LessonForm({
  action,
  initialValues,
  students,
  subjects,
  backHref,
  editing,
  timeZone,
}: LessonFormProps) {
  const [state, submit, pending] = useActionState(action, {
    values: initialValues,
    attempt: 0,
  });
  const [modality, setModality] = useState(initialValues.modality);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [date, setDate] = useState(initialValues.date);
  const [time, setTime] = useState(initialValues.time);
  const { values, errors } = state;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  function field(name: keyof LessonFormValues) {
    return {
      id: name,
      name,
      "aria-invalid": Boolean(errors?.[name]),
      "aria-describedby": errors?.[name] ? `${name}-erro` : undefined,
    };
  }

  return (
    <form action={submit} className="space-y-5">
      <Alert
        variant="error"
        message={
          state.message ?? (errors && "Confira os campos do formulário.")
        }
      />
      <fieldset
        key={state.attempt}
        disabled={pending}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field name="student_id" label="Aluno" error={errors?.student_id?.[0]}>
          <select
            {...field("student_id")}
            required
            defaultValue={values.student_id}
            className={selectClass}
          >
            <option value="">Selecione um aluno</option>
            {students.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          name="subject_id"
          label="Disciplina"
          error={errors?.subject_id?.[0]}
        >
          <select
            {...field("subject_id")}
            required
            defaultValue={values.subject_id}
            className={selectClass}
          >
            <option value="">Selecione uma disciplina</option>
            {subjects.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field name="date" label="Data" error={errors?.date?.[0]}>
          <Input
            {...field("date")}
            type="date"
            required
            defaultValue={values.date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <Field
          name="time"
          label={`Horário de início (${timeZone})`}
          error={errors?.time?.[0]}
        >
          <Input
            {...field("time")}
            type="time"
            step="any"
            required
            defaultValue={values.time}
            onChange={(event) => setTime(event.target.value)}
          />
        </Field>
        <Field
          name="duration_minutes"
          label="Duração em minutos"
          error={errors?.duration_minutes?.[0]}
        >
          <Input
            {...field("duration_minutes")}
            type="number"
            min={1}
            required
            defaultValue={values.duration_minutes}
          />
        </Field>
        <Field name="modality" label="Modalidade" error={errors?.modality?.[0]}>
          <select
            {...field("modality")}
            defaultValue={values.modality}
            onChange={(event) => setModality(event.target.value)}
            className={selectClass}
          >
            {Object.entries(lessonModalityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div hidden={modality !== "online"}>
          <Field
            name="meeting_url"
            label="Link do Google Meet (opcional)"
            error={errors?.meeting_url?.[0]}
          >
            <Input
              {...field("meeting_url")}
              type="url"
              defaultValue={values.meeting_url}
              disabled={modality !== "online"}
            />
          </Field>
        </div>
        {editing && (
          <Field name="status" label="Situação" error={errors?.status?.[0]}>
            <select
              {...field("status")}
              defaultValue={values.status}
              className={selectClass}
            >
              {editableLessonStatusSchema.options.map((status) => (
                <option key={status} value={status}>
                  {lessonStatusLabels[status]}
                </option>
              ))}
            </select>
          </Field>
        )}
        {!editing && (
          <div className="grid gap-3 border-t pt-2 sm:col-span-2">
            <label className="flex min-h-11 w-fit cursor-pointer items-center gap-3 font-semibold">
              <input
                {...field("repeat_weekly")}
                className="size-5 accent-primary"
                type="checkbox"
                checked={repeatWeekly}
                onChange={(event) => setRepeatWeekly(event.target.checked)}
              />
              Repetir toda semana
            </label>
            {errors?.repeat_weekly && (
              <p id="repeat_weekly-erro" className="text-sm text-destructive">
                {errors.repeat_weekly[0]}
              </p>
            )}
            {repeatWeekly && (
              <>
                <p aria-live="polite" className="text-sm text-muted-foreground">
                  {Number.isFinite(weekday) && time
                    ? weeklySchedule(weekday, time)
                    : "Escolha a data e o horário da primeira aula."}
                </p>
                <div className="sm:max-w-64">
                  <Field
                    name="end_date"
                    label="Repetir até (opcional)"
                    error={errors?.end_date?.[0]}
                  >
                    <Input
                      {...field("end_date")}
                      type="date"
                      min={date || undefined}
                      defaultValue={values.end_date}
                    />
                  </Field>
                </div>
              </>
            )}
          </div>
        )}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar aula"}
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>Voltar para a agenda</Link>
        </Button>
      </div>
    </form>
  );
}
