import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_BYTES = 72;
export const passwordRequirements = `pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com letras e números, e até ${PASSWORD_MAX_BYTES} bytes`;

export const emailSchema = z.string().trim().email().max(254);
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .regex(/[a-zA-Z]/)
  .regex(/[0-9]/)
  .refine(
    (value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES,
  );
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export const signupSchema = loginSchema.extend({ password: passwordSchema });
