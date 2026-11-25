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

const hourlyRateInReais = z
  .string()
  .trim()
  .regex(/^\d{1,8}(?:[,.]\d{1,2})?$/, "Informe um valor em reais, como 80,50.")
  .transform((value) => {
    const [reais, cents = ""] = value.split(/[,.]/);
    return Number(reais) * 100 + Number(cents.padEnd(2, "0"));
  })
  .pipe(
    z
      .number()
      .int()
      .positive("Informe um valor maior que zero.")
      .max(2147483647, "Informe um valor de até R$ 21.474.836,47."),
  );

export const studentFormSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do aluno."),
    birth_date: z.union([z.literal(""), z.iso.date()], {
      error: "Informe uma data de nascimento válida.",
    }),
    grade_id: z.union([z.literal(""), z.uuid()], {
      error: "Selecione um ano válido.",
    }),
    school: z.string().trim(),
    hourly_rate: z.string(),
    is_free: z.boolean(),
    notes: z.string().trim(),
    subject_ids: z.array(z.uuid(), { error: "Selecione disciplinas válidas." }),
  })
  .transform(
    (
      input,
      ctx,
    ): { student: z.input<typeof studentSchema>; subject_ids: string[] } => {
      const hourlyRate = input.is_free
        ? { success: true as const, data: 0 }
        : hourlyRateInReais.safeParse(input.hourly_rate);
      if (!hourlyRate.success) {
        ctx.addIssue({
          code: "custom",
          path: ["hourly_rate"],
          message: hourlyRate.error.issues[0].message,
        });
        return z.NEVER;
      }

      return {
        student: {
          name: input.name,
          birth_date: input.birth_date || null,
          grade_id: input.grade_id || null,
          school: input.school || null,
          hourly_rate: hourlyRate.data,
          is_free: input.is_free,
          notes: input.notes || null,
        },
        subject_ids: input.subject_ids,
      };
    },
  )
  .pipe(z.object({ student: studentSchema, subject_ids: z.array(z.uuid()) }));

export const studentRegistrationFormSchema = studentFormSchema.and(
  z.object({
    guardian_consent_confirmed: z.literal(true, {
      error: "Confirme a autorização do responsável para cadastrar o aluno.",
    }),
  }),
);
