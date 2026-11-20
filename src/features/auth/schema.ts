import { z } from "zod";

export const emailSchema = z.string().trim().email().max(254);
export const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine((value) => new TextEncoder().encode(value).length <= 72);
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export const signupSchema = loginSchema.extend({ password: passwordSchema });
