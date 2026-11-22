"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reversePayment } from "../actions";

export function ReversePayment({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  const [error, submit, pending] = useActionState(
    reversePayment.bind(null, id),
    "",
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="w-fit px-0">
          Estornar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estornar pagamento?</DialogTitle>
          <DialogDescription>
            {description} As cobranças deste pagamento voltarão para as
            pendências do aluno.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <form action={submit}>
            <Button className="w-full" type="submit" disabled={pending}>
              Confirmar estorno
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
