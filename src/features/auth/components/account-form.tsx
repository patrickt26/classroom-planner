"use client";

import { useActionState } from "react";
import { Alert, type FormFeedback } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Field = {
  name: string;
  label: string;
  defaultValue?: string;
  optional?: boolean;
} & (
  | {
      options?: undefined;
      type?: "email" | "password";
      autoComplete?: string;
      minLength?: number;
      maxLength?: number;
    }
  | { options: { value: string; label: string }[] }
);
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
      {fields.map(({ label, optional, options, ...field }) => (
        <label
          htmlFor={field.name}
          key={field.name}
          className="grid gap-2 font-medium"
        >
          {label}
          {options ? (
            <Select
              key={field.defaultValue}
              id={field.name}
              {...field}
              required={!optional}
            >
              {options.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          ) : (
            <Input id={field.name} {...field} required={!optional} />
          )}
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
