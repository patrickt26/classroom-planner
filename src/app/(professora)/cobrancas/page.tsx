import { Banknote, Clock3 } from "lucide-react";
import { z } from "zod";
import { getPendingCharges } from "@/features/charges/queries";
import {
  formatCalendarDay,
  localLessonDateTime,
} from "@/features/lessons/calendar";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { ReversePayment } from "@/features/payments/components/reverse-payment";
import { getPaymentHistory } from "@/features/payments/queries";
import { methodLabels } from "@/features/payments/schema";
import { monthlyTotals } from "@/features/payments/summary";
import { formatReais } from "@/features/students/form-state";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string | string[] }>;
}) {
  const ws = await requireTeacherWorkspace();
  const [groups, history, params] = await Promise.all([
    getPendingCharges(ws.workspace_id, ws.time_zone),
    getPaymentHistory(ws.workspace_id),
    searchParams,
  ]);
  const notice = z.enum(["registrado", "estornado"]).safeParse(params.aviso);
  const today = localLessonDateTime(new Date(), ws.time_zone).slice(0, 10);
  const totals = monthlyTotals(
    today.slice(0, 7),
    groups.flatMap((group) => group.charges),
    history,
  );
  return (
    <div className="grid gap-7">
      <header>
        <h1 className="text-3xl font-bold text-brown">Cobranças</h1>
        <p className="mt-1 text-muted-foreground">
          Resumo de{" "}
          {formatCalendarDay(today, { month: "long", year: "numeric" })}
        </p>
      </header>
      {notice.success && (
        <p
          role="status"
          className="rounded-lg bg-success-surface p-3 text-success"
        >
          {notice.data === "registrado"
            ? "Pagamento registrado."
            : "Pagamento estornado. As cobranças voltaram para as pendências."}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3">
        {[
          { label: "Recebido", value: totals.received, icon: Banknote },
          { label: "A receber", value: totals.receivable, icon: Clock3 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="grid min-w-0 gap-2 rounded-xl border bg-card p-4 sm:p-5"
          >
            <dt className="flex items-center gap-2 text-sm font-medium">
              <Icon aria-hidden className="size-5 text-brown" />
              {label}
            </dt>
            <dd className="wrap-anywhere text-xl font-bold tabular-nums sm:text-3xl">
              {formatReais.format(value / 100)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid items-start gap-7 xl:grid-cols-2">
        <section className="grid min-w-0 gap-3">
          <h2 className="text-xl font-semibold">Pendentes por aluno</h2>
          {groups.length === 0 && (
            <p className="rounded-xl border bg-card p-4 text-muted-foreground">
              Nenhuma cobrança pendente.
            </p>
          )}
          {groups.map(({ id, name, charges }) => (
            <article
              key={id}
              className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 wrap-anywhere">
                  <h3 className="font-semibold">{name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {charges.length === 1
                      ? "1 aula pendente"
                      : `${charges.length} aulas pendentes`}
                  </p>
                </div>
                <strong>
                  {formatReais.format(
                    charges.reduce((sum, charge) => sum + charge.amount, 0) /
                      100,
                  )}
                </strong>
              </div>
              <PaymentForm
                key={charges.map((c) => c.lessonId).join(",")}
                id={id}
                name={name}
                charges={charges}
                today={today}
              />
            </article>
          ))}
        </section>
        <section className="grid min-w-0 gap-3">
          <h2 className="text-xl font-semibold">Histórico de pagamentos</h2>
          {history.length === 0 && (
            <p className="rounded-xl border bg-card p-4 text-muted-foreground">
              Nenhum pagamento registrado.
            </p>
          )}
          {history.map((payment) => {
            const amount = formatReais.format(payment.amount_cents / 100);
            const day = formatCalendarDay(payment.paid_on, {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <article
                key={payment.id}
                className="grid gap-1 rounded-xl border bg-card px-4 py-3 sm:px-5"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="wrap-anywhere font-semibold">
                    {payment.students.name}
                  </h3>
                  <strong>{amount}</strong>
                </div>
                <p className="text-sm text-muted-foreground">
                  {day} · {methodLabels[payment.method]}
                </p>
                {payment.note && (
                  <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-sm">
                    {payment.note}
                  </p>
                )}
                {payment.reversed_at ? (
                  <p className="mt-2 w-fit rounded bg-muted px-2 py-1 text-sm">
                    Estornado
                  </p>
                ) : (
                  <ReversePayment
                    id={payment.id}
                    description={`Pagamento de ${amount} de ${payment.students.name} em ${day}.`}
                  />
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
