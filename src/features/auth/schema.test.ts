import { expect, test } from "vitest";
import { loginSchema, passwordSchema, signupSchema } from "./schema";

test.each(["abcdefgh1", "abcdefghij", "1234567890"])(
  "rejects a new password that does not meet the minimum requirements: %s",
  (password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
  },
);

test("accepts a ten-character password with letters and digits", () => {
  expect(passwordSchema.safeParse("abcdefghi1").success).toBe(true);
});

test("signup respects the byte limit for accented passwords", () => {
  const email = "professora@example.test";
  expect(
    signupSchema.safeParse({ email, password: `a1${"á".repeat(35)}` }).success,
  ).toBe(true);
  expect(
    signupSchema.safeParse({ email, password: `a1${"á".repeat(35)}b` }).success,
  ).toBe(false);
});

test("existing accounts can sign in with a shorter password", () => {
  const credentials = { email: "professora@example.test", password: "antiga" };
  expect(loginSchema.safeParse(credentials).success).toBe(true);
  expect(signupSchema.safeParse(credentials).success).toBe(false);
});
