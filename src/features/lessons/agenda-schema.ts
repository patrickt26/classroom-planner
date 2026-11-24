import { z } from "zod";
import { lessonStartInstant } from "./calendar";
import { lessonModalitySchema, lessonSchema } from "./schema";

export const editableLessonStatusSchema = z.enum([
  "agendada",
  "confirmada",
  "realizada",
  "falta",
]);

export const firstAgendaDate = "0001-01-01";

export const agendaDateSchema = z.iso
  .date()
  .refine(
    (date) => date >= firstAgendaDate && date <= "9999-12-26",
    "Informe uma data válida.",
  );

export const weeklyLessonSchema = z.discriminatedUnion("repeat_weekly", [
  z.object({ repeat_weekly: z.literal("") }),
  z
    .object({
      repeat_weekly: z.literal("on"),
      date: agendaDateSchema,
      end_date: z.union([z.literal(""), agendaDateSchema]),
    })
    .refine(({ date, end_date }) => !end_date || end_date >= date, {
      path: ["end_date"],
      message: "A data final deve ser igual ou posterior à data da aula.",
    }),
]);

export const lessonFormSchema = (timeZone: string) =>
  z
    .object({
      student_id: z.uuid("Selecione um aluno."),
      subject_id: z.uuid("Selecione uma disciplina."),
      date: agendaDateSchema,
      time: z.iso.time(),
      duration_minutes: z
        .string()
        .regex(/^\d+$/, "Informe a duração em minutos.")
        .transform(Number)
        .pipe(lessonSchema.shape.duration_minutes),
      modality: lessonModalitySchema,
      meeting_url: z.string(),
      status: editableLessonStatusSchema,
    })
    .transform(
      (
        { date, time, meeting_url, ...fields },
        ctx,
      ): z.input<typeof lessonSchema> => {
        const startsAt = lessonStartInstant(date, time, timeZone);
        if (!startsAt) {
          ctx.addIssue({
            code: "custom",
            path: ["time"],
            message:
              "Esse horário não existe no fuso do seu espaço nessa data.",
          });
          return z.NEVER;
        }
        return {
          ...fields,
          starts_at: startsAt.toISOString(),
          meeting_url:
            fields.modality === "online" ? meeting_url.trim() || null : null,
        };
      },
    )
    .pipe(lessonSchema);
