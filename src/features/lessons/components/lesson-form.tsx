"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  type ReactNode,
  useActionState,
  useRef,
  useState,
} from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { weeklySchedule } from "@/features/recurrences/schedule";
import { editableLessonStatusSchema } from "../agenda-schema";
import {
  type LessonDay,
  type LessonFieldErrors,
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
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function DayFields({
  dayKey,
  initialValues,
  subjects,
  timeZone,
  editing,
  errors,
}: {
  dayKey: number;
  initialValues: LessonDay;
  subjects: Option[];
  timeZone: string;
  editing?: boolean;
  errors?: LessonFieldErrors;
}) {
  const [day, setDay] = useState(initialValues);
  const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();

  function field(name: keyof LessonDay) {
    const id = `day.${dayKey}.${name}`;
    return {
      id,
      name: id,
      value: day[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setDay({ ...day, [name]: event.target.value }),
      "aria-invalid": Boolean(errors?.[name]),
      "aria-describedby": errors?.[name] ? `${id}-erro` : undefined,
    };
  }
  function label(name: keyof LessonDay, text: string) {
    return {
      id: `day.${dayKey}.${name}`,
      label: text,
      error: errors?.[name]?.[0],
    };
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="day_id" value={dayKey} />
      <Field {...label("date", "Data")}>
        <Input {...field("date")} type="date" required />
      </Field>
      <Field {...label("time", `Horário de início (${timeZone})`)}>
        <Input {...field("time")} type="time" step="any" required />
      </Field>
      <Field {...label("subject_id", "Disciplina")}>
        <select {...field("subject_id")} required className={selectClass}>
          <option value="">Selecione uma disciplina</option>
          {subjects.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </Field>
      <Field {...label("duration_minutes", "Duração em minutos")}>
        <Input {...field("duration_minutes")} type="number" min={1} required />
      </Field>
      <Field {...label("modality", "Modalidade")}>
        <select {...field("modality")} className={selectClass}>
          {Object.entries(lessonModalityLabels).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </Field>
      {day.modality === "online" && (
        <Field {...label("meeting_url", "Link do Google Meet (opcional)")}>
          <Input {...field("meeting_url")} type="url" />
        </Field>
      )}
      {editing ? (
        <Field {...label("status", "Situação")}>
          <select {...field("status")} className={selectClass}>
            {editableLessonStatusSchema.options.map((status) => (
              <option key={status} value={status}>
                {lessonStatusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="grid gap-2 border-t pt-2 sm:col-span-2">
          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-3 font-semibold">
            <input
              name={`day.${dayKey}.repeat_weekly`}
              type="checkbox"
              className="size-5 accent-primary"
              checked={day.repeat_weekly === "on"}
              onChange={(event) =>
                setDay({
                  ...day,
                  repeat_weekly: event.target.checked ? "on" : "",
                })
              }
            />
            Repetir toda semana
          </label>
          {day.repeat_weekly === "on" && (
            <>
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {Number.isFinite(weekday) && day.time
                  ? weeklySchedule(weekday, day.time)
                  : "Escolha a data e o horário da primeira aula."}
              </p>
              <div className="sm:max-w-64">
                <Field {...label("end_date", "Repetir até (opcional)")}>
                  <Input
                    {...field("end_date")}
                    type="date"
                    min={day.date || undefined}
                  />
                </Field>
              </div>
            </>
          )}
        </div>
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
  const [state, submit, pending] = useActionState<LessonFormState, FormData>(
    action,
    {},
  );
  const [studentId, setStudentId] = useState(initialValues.student_id);
  const [keys, setKeys] = useState([0]);
  const nextKey = useRef(1);
  const [dismissedConflict, setDismissedConflict] = useState<LessonFormState>();
  const dismissConflict = () => setDismissedConflict(state);
  return (
    <form
      action={submit}
      onChange={dismissConflict}
      // Success redirects. On validation errors the teacher can correct just one day.
      onReset={(event) => event.preventDefault()}
      className="space-y-5"
    >
      {/* Enter in a field always submits without confirming a conflict. */}
      <button type="submit" hidden disabled={pending} />
      <Alert variant="error" message={state.message} />
      <fieldset disabled={pending} className="grid min-w-0 gap-5">
        <Field id="student_id" label="Aluno" error={state.studentError}>
          <select
            id="student_id"
            name="student_id"
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            aria-invalid={Boolean(state.studentError)}
            aria-describedby={
              state.studentError ? "student_id-erro" : undefined
            }
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
        <div className={editing ? "" : "grid items-start gap-4 xl:grid-cols-2"}>
          {keys.map((key, index) => (
            <fieldset
              key={key}
              className={
                editing
                  ? "min-w-0"
                  : "min-w-0 rounded-xl border px-4 pb-4 only:xl:max-w-2xl only:xl:col-span-2"
              }
            >
              {!editing && (
                <legend className="px-1.5 text-lg font-bold text-brown">
                  Dia {index + 1}
                </legend>
              )}
              {keys.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Remover dia ${index + 1}`}
                    onClick={() => {
                      dismissConflict();
                      setKeys(keys.filter((item) => item !== key));
                    }}
                  >
                    <Trash2 aria-hidden="true" /> Remover
                  </Button>
                </div>
              )}
              <Alert variant="error" message={state.days?.[key]?.message} />
              {state.days?.[key]?.conflict && dismissedConflict !== state && (
                <div className="mb-4 grid justify-items-start gap-2">
                  <Alert
                    variant="error"
                    message={
                      keys.length > 1
                        ? "Há outra aula nesse horário. Ao confirmar, todos os dias serão salvos."
                        : "Há outra aula nesse horário."
                    }
                  />
                  <Button type="submit" name="allow_conflicts" value="true">
                    Salvar mesmo assim
                  </Button>
                </div>
              )}
              <DayFields
                dayKey={key}
                initialValues={initialValues}
                subjects={subjects}
                editing={editing}
                timeZone={timeZone}
                errors={state.days?.[key]?.fields}
              />
            </fieldset>
          ))}
        </div>
        {!editing && (
          <Button
            className="w-fit"
            type="button"
            variant="outline"
            onClick={() => {
              dismissConflict();
              setKeys([...keys, nextKey.current++]);
            }}
          >
            <Plus aria-hidden="true" /> Adicionar outro dia
          </Button>
        )}
      </fieldset>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando…"
            : keys.length > 1
              ? "Salvar aulas"
              : "Salvar aula"}
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>Voltar para a agenda</Link>
        </Button>
      </div>
    </form>
  );
}
