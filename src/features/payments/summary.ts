export function monthlyTotals(
  currentMonth: string,
  selectedMonth: string,
  pending: { lessonDate: string; amount: number }[],
  payments: {
    paid_on: string;
    amount_cents: number;
    reversed_at: string | null;
  }[],
) {
  let receivable = 0;
  let overdue = 0;
  for (const charge of pending) {
    receivable += charge.amount;
    if (charge.lessonDate.slice(0, 7) < currentMonth) overdue += charge.amount;
  }

  return {
    receivable,
    overdue,
    received: payments.reduce(
      (sum, payment) =>
        sum +
        (!payment.reversed_at && payment.paid_on.slice(0, 7) === selectedMonth
          ? payment.amount_cents
          : 0),
      0,
    ),
  };
}

export function shiftMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
