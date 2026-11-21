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

const messages = {
  cancel: {
    trigger: "Cancelar aula",
    title: "Cancelar esta aula?",
    description: "A aula ficará na agenda com a situação Cancelada.",
    confirm: "Confirmar cancelamento",
    pending: "Cancelando…",
  },
  delete: {
    trigger: "Excluir aula",
    title: "Excluir esta aula?",
    description:
      "Excluir apaga a aula como se nunca tivesse existido. Para registrar que a aula não vai acontecer, use Cancelar.",
    confirm: "Confirmar exclusão",
    pending: "Excluindo…",
  },
};

export function LessonConfirmationForm({
  action,
  operation,
}: {
  operation: keyof typeof messages;
  action: (previous: string) => Promise<string>;
}) {
  const [error, submit, pending] = useActionState(action, "");

  const copy = messages[operation];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          {copy.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
        <Alert variant="error" message={error} />
        <form action={submit}>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Manter aula
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? copy.pending : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
