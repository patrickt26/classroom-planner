import { z } from "zod";

export function normalizePhone(value: string) {
  const phone = value.trim();
  if (!/^\+?[\d ().-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");

  if (phone.startsWith("+")) {
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }
  if (/^55[1-9]\d{9,10}$/.test(digits)) return `+${digits}`;
  return /^[1-9]\d{9,10}$/.test(digits) ? `+55${digits}` : null;
}

export const guardianFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(120),
  relationship: z
    .string()
    .trim()
    .min(1, "Informe o parentesco ou vínculo.")
    .max(80),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(
      (phone) => !phone || normalizePhone(phone) !== null,
      "Informe um telefone com DDD ou com código do país.",
    )
    .transform(normalizePhone),
  financial: z.boolean(),
});

export type GuardianFormValues = z.input<typeof guardianFormSchema>;

export type GuardianFormState = {
  values: GuardianFormValues;
  errors?: Partial<Record<keyof GuardianFormValues, string[]>>;
  message?: string;
  attempt: number;
};
