"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { acceptTerms } from "../actions";

export function AcceptanceForm({ version }: { version: string }) {
  const [checked, setChecked] = useState(false);
  const [feedback, action, pending] = useActionState(acceptTerms, null);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="version" value={version} />
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          name="accepted"
          required
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="size-5 shrink-0 accent-primary"
        />
        Li e aceito os Termos de uso e a Política de privacidade
      </label>
      <Button type="submit" disabled={!checked || pending}>
        Continuar
      </Button>
      <Alert variant="error" message={feedback?.message} />
    </form>
  );
}
