import { expect, test } from "vitest";
import { localLessonDateTime } from "../lessons/calendar";
import { paymentMonthSchema } from "./schema";
import { monthlyTotals, shiftMonth } from "./summary";

test("o atraso segue o mês atual e o recebido segue o mês selecionado", () => {
  const date = localLessonDateTime(
    new Date("2027-01-01T02:30:00Z"),
    "America/Sao_Paulo",
  ).slice(0, 10);
  const pending = [
    { lessonDate: date, amount: 9005 },
    { lessonDate: "2027-01-01", amount: 1250 },
    { lessonDate: "2027-02-01", amount: 500 },
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
  expect(monthlyTotals("2027-01", "2026-12", pending, payments)).toEqual({
    received: 12505,
    receivable: 10755,
    overdue: 9005,
  });
  expect(monthlyTotals("2027-01", "2027-01", pending, payments)).toEqual({
    received: 2000,
    receivable: 10755,
    overdue: 9005,
  });
  expect(monthlyTotals("2027-01", "2026-11", pending, payments)).toEqual({
    received: 0,
    receivable: 10755,
    overdue: 9005,
  });

  expect(monthlyTotals("2026-12", "2027-01", pending, payments).overdue).toBe(
    0,
  );
});

test("o resumo começa em zero sem cobranças ou pagamentos", () => {
  expect(monthlyTotals("2027-01", "2027-01", [], [])).toEqual({
    received: 0,
    receivable: 0,
    overdue: 0,
  });
});

test("a navegação mensal atravessa a virada do ano", () => {
  expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  expect(shiftMonth("2027-01", -1)).toBe("2026-12");
  expect(paymentMonthSchema.safeParse(shiftMonth("0001-01", -1)).success).toBe(
    false,
  );
  expect(paymentMonthSchema.safeParse(shiftMonth("9999-12", 1)).success).toBe(
    false,
  );
});

test.each([
  { input: "2027-00" },
  { input: "2027-13" },
  { input: "2027-1" },
  { input: "2027-01-01" },
  { input: ["2027-01"] },
])("rejeita o mês inválido $input", ({ input }) => {
  expect(paymentMonthSchema.safeParse(input).success).toBe(false);
});
