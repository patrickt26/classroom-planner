"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuardianFormState, GuardianFormValues } from "../schema";

const fields = [
  { name: "name", label: "Nome do responsável", maxLength: 120 },
  { name: "relationship", label: "Parentesco ou vínculo", maxLength: 80 },
  { name: "phone", label: "Telefone", maxLength: 40 },
] as const;

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
        {fields.map(({ name, label, maxLength }) => {
          const error = state.errors?.[name]?.[0];
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
                name={name}
                type={isPhone ? "tel" : "text"}
                defaultValue={state.values[name]}
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
        <FinancialGuardianField checked={state.values.financial} />
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

export function FinancialGuardianField({ checked }: { checked: boolean }) {
  return (
    <>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          name="financial"
          defaultChecked={checked}
          className="size-4 accent-navy"
          aria-describedby="guardian-financial-hint"
        />
        Responsável financeiro
      </label>
      <p
        id="guardian-financial-hint"
        className="-mt-3 text-sm text-muted-foreground"
      >
        Ao marcar esta opção, você substitui o responsável financeiro atual.
      </p>
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
