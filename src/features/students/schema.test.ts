import { describe, expect, it } from "vitest";
import { studentSchema } from "./schema";

describe("studentSchema", () => {
  it("preserva o valor em centavos e normaliza o nome", () => {
    expect(
      studentSchema.parse({ name: " Aluno A ", hourly_rate: 8050 }),
    ).toEqual({
      name: "Aluno A",
      hourly_rate: 8050,
      is_free: false,
    });
  });

  it("aceita gratuidade com valor zero", () => {
    expect(
      studentSchema.safeParse({
        name: "Aluno B",
        hourly_rate: 0,
        is_free: true,
      }).success,
    ).toBe(true);
  });

  it.each([
    { hourly_rate: 80.5 },
    { hourly_rate: -1 },
    { hourly_rate: 2 ** 31 },
    { hourly_rate: 0, is_free: false },
    { hourly_rate: 100, is_free: true },
    { name: "  " },
    { grade_id: "4º ano" },
    { birth_date: "2016-02-30" },
  ])("recusa dados inválidos %o", (fields) => {
    expect(
      studentSchema.safeParse({ name: "Aluno A", hourly_rate: 100, ...fields })
        .success,
    ).toBe(false);
  });
});
