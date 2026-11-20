import { expect, test } from "vitest";
import { loginSchema, signupSchema } from "./schema";

test("signup respects the byte limit for accented passwords", () => {
  const email = "professora@example.test";
  expect(
    signupSchema.safeParse({ email, password: "á".repeat(36) }).success,
  ).toBe(true);
  expect(
    signupSchema.safeParse({ email, password: "á".repeat(37) }).success,
  ).toBe(false);
});

test("existing accounts can sign in with a shorter password", () => {
  const credentials = { email: "professora@example.test", password: "antiga" };
  expect(loginSchema.safeParse(credentials).success).toBe(true);
  expect(signupSchema.safeParse(credentials).success).toBe(false);
});
