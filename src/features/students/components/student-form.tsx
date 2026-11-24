"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  initialStudentGuardian,
  type StudentFormState,
  type StudentFormValues,
} from "../form-state";
import { RegistrationGuardian } from "./registration-guardian";

type Option = { id: string; name: string };

const fieldClassName =
  "min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive md:text-sm";

const textFields = [
  {
    name: "name",
    label: "Nome do aluno",
    type: "text",
    hint: "Pode usar um apelido",
  },
  {
    name: "birth_date",
    label: "Data de nascimento",
    type: "date",
    hint: "Opcional",
  },
  { name: "school", label: "Escola", type: "text", hint: "Opcional" },
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
  requireGuardian = false,
}: {
  action: (
    state: StudentFormState,
    form: FormData,
  ) => Promise<StudentFormState>;
  initialValues: StudentFormValues;
  grades: Option[];
  subjects: Option[];
  listHref: string;
  requireGuardian?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
    attempt: 0,
  });
  const [isFree, setIsFree] = useState(initialValues.is_free);
  const { values, errors } = state;

  function fieldProps(name: keyof StudentFormValues, hintId?: string) {
    const hasError = Boolean(errors?.[name]?.length);
    const description = [hintId, hasError && `${name}-error`]
      .filter(Boolean)
      .join(" ");
    return {
      "aria-invalid": hasError || undefined,
      "aria-describedby": description || undefined,
    };
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
      <fieldset disabled={pending} className="grid min-w-0 gap-5">
        <div key={state.attempt} className="grid min-w-0 gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {textFields.map(({ name, label, type, hint }) => (
              <div className="grid min-w-0 gap-2" key={name}>
                <label htmlFor={name} className="text-sm font-semibold">
                  {label}
                </label>
                {type === "date" ? (
                  <DatePicker
                    id={name}
                    name={name}
                    label={label}
                    defaultValue={values[name]}
                    {...fieldProps(name, `${name}-hint`)}
                  />
                ) : (
                  <Input
                    id={name}
                    name={name}
                    type={type}
                    defaultValue={values[name]}
                    required={name === "name"}
                    {...fieldProps(name, `${name}-hint`)}
                  />
                )}
                <p
                  id={`${name}-hint`}
                  className="text-sm text-muted-foreground"
                >
                  {hint}
                </p>
                <FieldError name={name} errors={errors?.[name]} />
              </div>
            ))}
            <div className="grid gap-2">
              <label htmlFor="grade_id" className="text-sm font-semibold">
                Ano escolar
              </label>
              <Select
                id="grade_id"
                name="grade_id"
                defaultValue={values.grade_id}
                {...fieldProps("grade_id")}
              >
                <option value="">Selecione o ano</option>
                {grades.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
              <FieldError name="grade_id" errors={errors?.grade_id} />
            </div>
          </div>

          <fieldset className="min-w-0" {...fieldProps("subject_ids")}>
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
                placeholder="R$"
                defaultValue={values.hourly_rate}
                disabled={isFree}
                required={!isFree}
                {...(!isFree && fieldProps("hourly_rate"))}
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
              {...fieldProps("notes", "notes-hint")}
            />
            <p id="notes-hint" className="text-sm text-muted-foreground">
              Evite registrar diagnósticos ou informações de saúde
            </p>
            <FieldError name="notes" errors={errors?.notes} />
          </div>
        </div>
        {requireGuardian && (
          <RegistrationGuardian
            state={state.guardian ?? initialStudentGuardian}
          />
        )}
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
