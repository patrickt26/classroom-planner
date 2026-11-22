"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuardianLinkState } from "../schema";
import { FinancialGuardianField } from "./guardian-form";

export function GuardianLinkForm({
  action,
  searchHref,
}: {
  action: (
    state: GuardianLinkState,
    form: FormData,
  ) => Promise<GuardianLinkState>;
  searchHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: { relationship: "", financial: false },
    attempt: 0,
  });
  const error = state.errors?.relationship?.[0];

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <Alert variant="error" message={state.message} />
      <div key={state.attempt} className="grid gap-4">
        <div className="grid gap-1.5">
          <label
            className="text-sm font-semibold"
            htmlFor="guardian-link-relationship"
          >
            Parentesco ou vínculo
          </label>
          <Input
            id="guardian-link-relationship"
            name="relationship"
            defaultValue={state.values.relationship}
            maxLength={80}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "guardian-link-relationship-error" : undefined
            }
          />
          {error && (
            <p
              id="guardian-link-relationship-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
        <FinancialGuardianField checked={state.values.financial} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Vinculando…" : "Vincular responsável"}
        </Button>
        <Button asChild variant="outline">
          <Link href={searchHref}>Voltar à busca</Link>
        </Button>
      </div>
    </form>
  );
}
