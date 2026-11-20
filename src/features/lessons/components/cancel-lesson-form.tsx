"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CancelLessonForm({
  action,
}: {
  action: (previous: string) => Promise<string>;
}) {
  const [error, submit, pending] = useActionState(action, "");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          Cancelar aula
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogTitle>Cancelar esta aula?</DialogTitle>
        <DialogDescription>
          A aula ficará na agenda com a situação Cancelada.
        </DialogDescription>
        <Alert variant="error" message={error} />
        <form action={submit}>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Manter aula
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Cancelando…" : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
