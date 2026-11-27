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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logoutEverywhere } from "../actions";

export function LogoutEverywhere() {
  const [feedback, action, pending] = useActionState(logoutEverywhere, null);

  return (
    <div className="grid justify-items-start gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" aria-describedby="logout-everywhere-help">
            Sair de todos os aparelhos
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader className="pr-0">
            <DialogTitle>Sair de todos os aparelhos?</DialogTitle>
            <DialogDescription>
              Você precisará entrar novamente em todos os aparelhos.
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <Alert variant={feedback.variant} message={feedback.message} />
          )}
          <form action={action}>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Saindo…" : "Confirmar saída"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p id="logout-everywhere-help" className="text-sm text-muted-foreground">
        Use se perdeu um aparelho ou entrou num computador que não é seu.
      </p>
    </div>
  );
}
