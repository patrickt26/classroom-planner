import { describe, expect, it } from "vitest";
import { formatGuardianPhone } from "./phone";
import { normalizePhone } from "./schema";

describe("formatGuardianPhone", () => {
  it.each([
    ["21987654321", "(21) 98765-4321"],
    ["2134567890", "(21) 3456-7890"],
    ["+5521987654321", "+55 (21) 98765-4321"],
    ["552134567890", "55 (21) 3456-7890"],
    ["55987654321", "(55) 98765-4321"],
    ["+12025550123", "+12025550123"],
    ["21abc34567890", "21abc34567890"],
  ])("formats %s and preserves its normalization", (input, expected) => {
    const formatted = formatGuardianPhone(input);
    expect(formatted).toBe(expected);
    expect(normalizePhone(formatted)).toBe(normalizePhone(input));
  });

  it.each(["21987654321", "2134567890", "+5521987654321", "552134567890"])(
    "formats %s as its digits are typed",
    (input) => {
      const typed = [...input].reduce(
        (value, character) => formatGuardianPhone(value + character),
        "",
      );
      expect(typed).toBe(formatGuardianPhone(input));
    },
  );
});
