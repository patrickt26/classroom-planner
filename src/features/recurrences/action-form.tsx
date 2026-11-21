"use client";

import { type ReactNode, useActionState } from "react";
import { Button } from "@/components/ui/button";

export function ActionForm({
  action,
  label,
  children,
}: {
  action: (previous: string, form: FormData) => Promise<string>;
  label: string;
  children?: ReactNode;
}) {
  const [message, submit, pending] = useActionState(action, "");
  return (
    <form action={submit} className="grid min-w-0 gap-2">
      <fieldset disabled={pending} className="grid min-w-0 gap-3">
        {children}
      </fieldset>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <Button
        className="w-fit max-w-full whitespace-normal"
        type="submit"
        disabled={pending}
      >
        {label}
      </Button>
    </form>
  );
}
