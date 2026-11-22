export function monthlyTotals(
  month: string,
  pending: { lessonDate: string; amount: number }[],
  payments: {
    paid_on: string;
    amount_cents: number;
    reversed_at: string | null;
  }[],
) {
  return {
    receivable: pending.reduce(
      (sum, charge) =>
        sum + (charge.lessonDate.slice(0, 7) === month ? charge.amount : 0),
      0,
    ),
    received: payments.reduce(
      (sum, payment) =>
        sum +
        (!payment.reversed_at && payment.paid_on.slice(0, 7) === month
          ? payment.amount_cents
          : 0),
      0,
    ),
  };
}
