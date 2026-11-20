import { z } from "zod";

const nameSchema = z.string().trim().min(1);
export const gradeSchema = z.object({ name: nameSchema });
export const subjectSchema = z.object({ name: nameSchema });

export const studentSchema = z
  .object({
    name: nameSchema,
    birth_date: z.iso.date().nullish(),
    grade_id: z.uuid().nullish(),
    school: z.string().trim().nullish(),
    hourly_rate: z.int32().nonnegative(),
    is_free: z.boolean().default(false),
    notes: z.string().trim().nullish(),
  })
  .refine(
    ({ is_free, hourly_rate }) =>
      is_free ? hourly_rate === 0 : hourly_rate > 0,
    {
      path: ["hourly_rate"],
      message:
        "Informe zero para aluno gratuito ou um valor positivo em centavos.",
    },
  );

export const guardianSchema = z.object({
  name: nameSchema,
  phone: z.string().trim().nullish(),
});

export const studentGuardianSchema = z.object({
  student_id: z.uuid(),
  guardian_id: z.uuid(),
  relationship: nameSchema,
  is_financial_guardian: z.boolean().default(false),
});

export const studentSubjectSchema = z.object({
  student_id: z.uuid(),
  subject_id: z.uuid(),
});
