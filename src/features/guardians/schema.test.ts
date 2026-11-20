import { describe, expect, it } from "vitest";
import { guardianFormSchema, normalizePhone } from "./schema";

describe("normalizePhone", () => {
  it.each([
    ["(00) 00000-0000", null],
    ["(11) 00000-0000", "+5511000000000"],
    ["55 11 0000-0000", "+551100000000"],
    ["+1 (202) 555-0100", "+12025550100"],
    ["", null],
    ["11 00000-0000 ramal 2", null],
    ["javascript:5511000000000", null],
  ])("normalizes %j as %j", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe("guardianFormSchema", () => {
  const values = {
    name: " Responsável Exemplo ",
    relationship: " Tutor ",
    phone: "",
    financial: true,
  };

  it("accepts a financial guardian without a phone", () => {
    expect(guardianFormSchema.parse(values)).toEqual({
      name: "Responsável Exemplo",
      relationship: "Tutor",
      phone: null,
      financial: true,
    });
  });

  it("rejects blank names, missing relationships and malformed phone numbers", () => {
    const result = guardianFormSchema.safeParse({
      ...values,
      name: " ",
      relationship: "",
      phone: "123",
    });
    expect(result.error?.issues.map(({ path }) => path[0])).toEqual([
      "name",
      "relationship",
      "phone",
    ]);
  });
});
