"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGuardianPhone } from "../phone";
import type { GuardianFormState, GuardianFormValues } from "../schema";

const fields = [
  { name: "name", label: "Nome do responsável", maxLength: 120 },
  { name: "relationship", label: "Parentesco ou vínculo", maxLength: 80 },
  { name: "phone", label: "Telefone", maxLength: 40 },
] as const;

function maskPhone(input: HTMLInputElement) {
  const { value, selectionStart } = input;
  const formatted = formatGuardianPhone(value);
  if (formatted === value) return;

  input.value = formatted;
  if (selectionStart === null || selectionStart === value.length) return;

  let remaining = value.slice(0, selectionStart).replace(/[^+\d]/g, "").length;
  let caret = 0;
  while (caret < formatted.length && remaining > 0) {
    if (/[+\d]/.test(formatted.charAt(caret))) remaining--;
    caret++;
  }
  input.setSelectionRange(caret, caret);
}

export function GuardianForm({
  action,
  initialValues,
  cancelHref,
}: {
  action: (
    state: GuardianFormState,
    form: FormData,
  ) => Promise<GuardianFormState>;
  initialValues: GuardianFormValues;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
    attempt: 0,
  });

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <Alert variant="error" message={state.message} />
      <div key={state.attempt} className="grid gap-4">
        <GuardianFields values={state.values} errors={state.errors} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar responsável"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}

export function GuardianFields({
  values,
  errors,
  prefix = "",
  existing = false,
}: {
  values: GuardianFormValues;
  errors?: GuardianFormState["errors"];
  prefix?: string;
  existing?: boolean;
}) {
  return (
    <>
      {fields.map(({ name, label, maxLength }) => {
        if (existing && name !== "relationship") return null;
        const error = errors?.[name]?.[0];
        const isPhone = name === "phone";
        const description = error
          ? `guardian-${name}-error`
          : isPhone
            ? "guardian-phone-hint"
            : undefined;
        return (
          <div key={name} className="grid gap-1.5">
            <label
              className="text-sm font-semibold"
              htmlFor={`guardian-${name}`}
            >
              {label}
            </label>
            <Input
              id={`guardian-${name}`}
              name={prefix + name}
              type={isPhone ? "tel" : "text"}
              defaultValue={
                isPhone ? formatGuardianPhone(values[name]) : values[name]
              }
              onChange={
                isPhone ? (event) => maskPhone(event.currentTarget) : undefined
              }
              maxLength={maxLength}
              required={!isPhone}
              aria-invalid={Boolean(error)}
              aria-describedby={description}
            />
            {error ? (
              <p
                id={`guardian-${name}-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ) : (
              isPhone && (
                <p
                  id="guardian-phone-hint"
                  className="text-sm text-muted-foreground"
                >
                  Opcional. Use DDD ou código do país com +.
                </p>
              )
            )}
          </div>
        );
      })}
      <FinancialGuardianField
        checked={values.financial}
        name={`${prefix}financial`}
        showHint={!prefix}
      />
    </>
  );
}

export function FinancialGuardianField({
  checked,
  name = "financial",
  showHint = true,
}: {
  checked: boolean;
  name?: string;
  showHint?: boolean;
}) {
  return (
    <>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          className="size-4 accent-navy"
          aria-describedby={showHint ? "guardian-financial-hint" : undefined}
        />
        Responsável financeiro
      </label>
      {showHint && (
        <p
          id="guardian-financial-hint"
          className="-mt-3 text-sm text-muted-foreground"
        >
          Ao marcar esta opção, você substitui o responsável financeiro atual.
        </p>
      )}
    </>
  );
}

export function RemoveGuardianForm({
  action,
  cancelHref,
  name,
}: {
  action: (state: string, form: FormData) => Promise<string>;
  cancelHref: string;
  name: string;
}) {
  const [error, formAction, pending] = useActionState(action, "");

  return (
    <form action={formAction} className="grid gap-4">
      <Alert variant="error" message={error} />
      <p className="wrap-anywhere">
        Remover <strong>{name}</strong> da ficha deste aluno?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Removendo…" : "Confirmar remoção"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
