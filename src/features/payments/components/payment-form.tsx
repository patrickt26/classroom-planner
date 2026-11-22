"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PendingCharge } from "@/features/charges/queries";
import { formatReais } from "@/features/students/form-state";
import { recordPayment } from "../actions";
import { methodLabels } from "../schema";

export function PaymentForm({
  id,
  name,
  charges,
  today,
}: {
  id: string;
  name: string;
  charges: PendingCharge[];
  today: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, submit, pending] = useActionState(
    recordPayment.bind(null, id),
    "",
  );
  const chosen = charges.filter((charge) => selected.includes(charge.lessonId));
  const total = chosen.reduce((sum, charge) => sum + charge.amount, 0);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Registrar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-4">
          <fieldset disabled={pending} className="grid gap-1">
            <legend className="mb-1 font-semibold">
              Selecione as aulas pagas
            </legend>
            {charges.map((charge) => (
              <label
                key={charge.lessonId}
                className="flex min-h-12 items-center gap-3 border-b py-2"
              >
                <input
                  name="lessonId"
                  type="checkbox"
                  value={charge.lessonId}
                  checked={selected.includes(charge.lessonId)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...selected, charge.lessonId]
                        : selected.filter((id) => id !== charge.lessonId),
                    )
                  }
                  className="size-5 shrink-0 accent-navy"
                />
                <span className="min-w-0 flex-1 wrap-anywhere">
                  {charge.subject}
                  <small className="block text-muted-foreground">
                    {charge.lessonDate.split("-").reverse().join("/")} ·{" "}
                    {charge.time}
                  </small>
                </span>
                <span className="font-semibold">
                  {formatReais.format(charge.amount / 100)}
                </span>
              </label>
            ))}
          </fieldset>
          <div
            className="flex justify-between rounded-lg bg-muted px-3 py-3 font-semibold"
            aria-live="polite"
          >
            <span>Total selecionado</span>
            <span>{formatReais.format(total / 100)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              htmlFor={`paid-on-${id}`}
              className="grid min-w-0 gap-1 font-medium"
            >
              Data do pagamento
              <Input
                id={`paid-on-${id}`}
                name="paidOn"
                type="date"
                required
                min={chosen.at(-1)?.lessonDate}
                max={today}
                defaultValue={today}
              />
            </label>
            <label className="grid min-w-0 gap-1 font-medium">
              Forma de pagamento
              <select
                name="method"
                required
                defaultValue=""
                className="min-h-11 rounded-lg border border-input bg-card px-2"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {Object.entries(methodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1 font-medium">
            Observação (opcional)
            <textarea
              name="note"
              rows={2}
              maxLength={1000}
              className="rounded-lg border border-input p-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending || !chosen.length}>
            {pending ? "Registrando…" : "Confirmar pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
