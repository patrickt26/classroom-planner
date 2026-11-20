import { z } from "zod";
import { Constants } from "../../types/database";

export const lessonModalitySchema = z.enum(
  Constants.public.Enums.lesson_modality,
);
export const lessonStatusSchema = z.enum(Constants.public.Enums.lesson_status);

const scheduleFields = {
  student_id: z.uuid(),
  duration_minutes: z.int32().positive(),
  modality: lessonModalitySchema,
  meeting_url: z
    .string()
    .trim()
    .regex(
      /^https:\/\/meet\.google\.com\/\S+$/,
      "Informe um link válido do Google Meet.",
    )
    .nullish(),
};

export const recurrenceSchema = z
  .object({
    ...scheduleFields,
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.iso.time(),
    start_date: z.iso.date(),
    end_date: z.iso.date().nullish(),
  })
  .refine(({ start_date, end_date }) => !end_date || end_date >= start_date, {
    path: ["end_date"],
    message: "A data final deve ser igual ou posterior à data inicial.",
  });

export const lessonSchema = z.object({
  ...scheduleFields,
  subject_id: z.uuid(),
  starts_at: z.iso.datetime({ offset: true }),
  recurrence_id: z.uuid().nullish(),
  status: lessonStatusSchema.default("agendada"),
  rescheduled_from_id: z.uuid().nullish(),
});
