"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudentFormState, StudentFormValues } from "../form-state";

type Option = { id: string; name: string };

const fieldClassName =
  "min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive md:text-sm";

const textFields = [
  { name: "name", label: "Nome do aluno", type: "text" },
  { name: "birth_date", label: "Data de nascimento", type: "date" },
  { name: "school", label: "Escola", type: "text" },
] as const;

function FieldError({
  name,
  errors,
}: {
  name: keyof StudentFormValues;
  errors?: string[];
}) {
  if (!errors?.length) return null;
  return (
    <p id={`${name}-error`} className="text-sm font-normal text-destructive">
      {errors[0]}
    </p>
  );
}

export function StudentForm({
  action,
  initialValues,
  grades,
  subjects,
  listHref,
}: {
  action: (
    state: StudentFormState,
    form: FormData,
  ) => Promise<StudentFormState>;
  initialValues: StudentFormValues;
  grades: Option[];
  subjects: Option[];
  listHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
    attempt: 0,
  });
  const [isFree, setIsFree] = useState(initialValues.is_free);
  const { values, errors } = state;

  function errorProps(name: keyof StudentFormValues) {
    return errors?.[name]?.length
      ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
      : {};
  }

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <Alert
        variant="error"
        message={
          state.message ??
          (errors ? "Confira os campos destacados." : undefined)
        }
      />
      <fieldset
        key={state.attempt}
        disabled={pending}
        className="grid min-w-0 gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {textFields.map(({ name, label, type }) => (
            <div className="grid min-w-0 gap-2" key={name}>
              <label htmlFor={name} className="text-sm font-semibold">
                {label}
              </label>
              <Input
                id={name}
                name={name}
                type={type}
                defaultValue={values[name]}
                required={name === "name"}
                {...errorProps(name)}
              />
              <FieldError name={name} errors={errors?.[name]} />
            </div>
          ))}
          <div className="grid gap-2">
            <label htmlFor="grade_id" className="text-sm font-semibold">
              Ano escolar
            </label>
            <select
              id="grade_id"
              name="grade_id"
              className={fieldClassName}
              defaultValue={values.grade_id}
              {...errorProps("grade_id")}
            >
              <option value="">Selecione o ano</option>
              {grades.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <FieldError name="grade_id" errors={errors?.grade_id} />
          </div>
        </div>

        <fieldset className="min-w-0" {...errorProps("subject_ids")}>
          <legend className="mb-1 text-sm font-semibold">Disciplinas</legend>
          <div className="flex flex-wrap gap-x-4">
            {subjects.map(({ id, name }) => (
              <label
                key={id}
                className="flex min-h-11 min-w-11 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="subject_ids"
                  value={id}
                  defaultChecked={values.subject_ids.includes(id)}
                  className="size-4 accent-primary"
                />
                {name}
              </label>
            ))}
          </div>
          <FieldError name="subject_ids" errors={errors?.subject_ids} />
        </fieldset>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div className="grid min-w-0 gap-2">
            <label htmlFor="hourly_rate" className="text-sm font-semibold">
              Valor por hora (R$)
            </label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              inputMode="decimal"
              placeholder="80,50"
              defaultValue={values.hourly_rate}
              disabled={isFree}
              required={!isFree}
              {...(!isFree && errorProps("hourly_rate"))}
            />
            {!isFree && (
              <FieldError name="hourly_rate" errors={errors?.hourly_rate} />
            )}
          </div>
          <label className="flex min-h-11 min-w-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_free"
              checked={isFree}
              onChange={(event) => setIsFree(event.target.checked)}
              className="size-4 accent-primary"
            />
            Aula gratuita
          </label>
        </div>

        <div className="grid gap-2">
          <label htmlFor="notes" className="text-sm font-semibold">
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={values.notes}
            className={fieldClassName}
            {...errorProps("notes")}
          />
          <FieldError name="notes" errors={errors?.notes} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            {pending ? "Salvando…" : "Salvar aluno"}
          </Button>
          <Button asChild variant="ghost">
            <Link href={listHref}>Cancelar</Link>
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

export function BackToStudents({ href = "/alunos" }: { href?: string }) {
  return (
    <Button asChild variant="ghost" className="-ml-2.5 mb-2">
      <Link href={href}>
        <ArrowLeft aria-hidden="true" /> Alunos
      </Link>
    </Button>
  );
}

export function StudentStatusForm({
  action,
  archived,
}: {
  action: (state: string, form: FormData) => Promise<string>;
  archived: boolean;
}) {
  const [message, formAction, pending] = useActionState(action, "");
  return (
    <form action={formAction} className="grid justify-items-start gap-2">
      <input
        type="hidden"
        name="status"
        value={archived ? "reativar" : "arquivar"}
      />
      <Button
        type="submit"
        variant={archived ? "outline" : "destructive"}
        disabled={pending}
      >
        {archived ? "Reativar aluno" : "Arquivar aluno"}
      </Button>
      <Alert variant="error" message={message} />
    </form>
  );
}
