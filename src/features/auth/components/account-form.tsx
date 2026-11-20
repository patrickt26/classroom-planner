"use client";

import { useActionState } from "react";
import { Alert, type AlertVariant } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FormFeedback = { variant: AlertVariant; message: string } | null;

type Field = {
  name: string;
  label: string;
  type?: "email" | "password";
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
  optional?: boolean;
};
export function AccountForm({
  action,
  fields,
  submit,
}: {
  action: (state: FormFeedback, data: FormData) => Promise<FormFeedback>;
  fields: Field[];
  submit: string;
}) {
  const [feedback, formAction, pending] = useActionState(action, null);
  const error = feedback?.variant === "error" ? feedback : null;
  const status = feedback?.variant !== "error" ? feedback : null;
  return (
    <form action={formAction} className="grid gap-5">
      {fields.map(({ label, optional, ...field }) => (
        <label
          htmlFor={field.name}
          key={field.name}
          className="grid gap-2 font-medium"
        >
          {label}
          <Input id={field.name} {...field} required={!optional} />
        </label>
      ))}
      <Button type="submit" disabled={pending}>
        {submit}
      </Button>
      <Alert variant="error" message={error?.message} />
      <Alert variant={status?.variant ?? "info"} message={status?.message} />
    </form>
  );
}
