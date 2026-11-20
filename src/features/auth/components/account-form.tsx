"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  action: (state: string, data: FormData) => Promise<string>;
  fields: Field[];
  submit: string;
}) {
  const [message, formAction, pending] = useActionState(action, "");
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
      <div role="status" className="text-sm empty:hidden">
        {message}
      </div>
    </form>
  );
}
