import { expect, test } from "vitest";
import { localLessonDateTime } from "../lessons/calendar";
import { monthlyTotals } from "./summary";

test("pendências seguem o mês local da aula e recebimentos seguem a data do pagamento", () => {
  const date = localLessonDateTime(
    new Date("2027-01-01T02:30:00Z"),
    "America/Sao_Paulo",
  ).slice(0, 10);
  const pending = [
    { lessonDate: date, amount: 9005 },
    { lessonDate: "2027-01-01", amount: 1250 },
  ];
  const payments = [
    { paid_on: "2026-12-01", amount_cents: 8000, reversed_at: null },
    { paid_on: "2026-12-31", amount_cents: 4505, reversed_at: null },
    { paid_on: "2027-01-01", amount_cents: 2000, reversed_at: null },
    {
      paid_on: "2026-12-15",
      amount_cents: 5000,
      reversed_at: "2027-01-02T12:00:00Z",
    },
  ];
  expect(monthlyTotals("2026-12", pending, payments)).toEqual({
    received: 12505,
    receivable: 9005,
  });
  expect(monthlyTotals("2027-01", pending, payments)).toEqual({
    received: 2000,
    receivable: 1250,
  });
  expect(monthlyTotals("2026-11", pending, payments)).toEqual({
    received: 0,
    receivable: 0,
  });
});
