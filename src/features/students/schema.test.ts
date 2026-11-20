import { describe, expect, it } from "vitest";
import { emptyStudentForm } from "./form-state";
import { studentFormSchema, studentSchema } from "./schema";

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

describe("studentFormSchema", () => {
  const values = { ...emptyStudentForm, name: " Aluno A " };

  it.each([
    ["80,50", 8050],
    ["80.5", 8050],
    ["80", 8000],
    ["0,01", 1],
    ["21474836,47", 2147483647],
  ])("converte %s reais em %s centavos", (hourly_rate, cents) => {
    const { student } = studentFormSchema.parse({ ...values, hourly_rate });
    expect(student).toMatchObject({
      name: "Aluno A",
      hourly_rate: cents,
      birth_date: null,
      grade_id: null,
      school: null,
    });
  });

  it.each(["", "0", "-1", "1,005", "1e2", "21474836,48", "R$ 80"])(
    "associa o valor inválido %s ao campo correspondente",
    (hourly_rate) => {
      const result = studentFormSchema.safeParse({ ...values, hourly_rate });
      expect(result.error?.issues[0].path).toEqual(["hourly_rate"]);
    },
  );

  it("guarda zero centavos quando a opção gratuita está marcada", () => {
    const { student } = studentFormSchema.parse({
      ...values,
      hourly_rate: "80,50",
      is_free: true,
    });
    expect(student).toMatchObject({ hourly_rate: 0, is_free: true });
  });

  it.each([
    { name: " " },
    { birth_date: "2016-02-30" },
    { grade_id: "4º ano" },
    { subject_ids: ["Matemática"] },
  ])("rejeita os dados inválidos %o", (fields) => {
    expect(
      studentFormSchema.safeParse({ ...values, hourly_rate: "80", ...fields })
        .success,
    ).toBe(false);
  });
});
