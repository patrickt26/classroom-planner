import { z } from "zod";
import { Constants } from "../../types/database";

export const lessonModalitySchema = z.enum(
  Constants.public.Enums.lesson_modality,
);
export const lessonStatusSchema = z.enum(Constants.public.Enums.lesson_status);

const scheduleFields = {
  student_id: z.uuid(),
  subject_id: z.uuid(),
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

export const recurrenceSettingsSchema = z
  .object({
    ...scheduleFields,
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.iso.time(),
    end_date: z.iso.date().nullish(),
  })
  .omit({ student_id: true });

export const recurrenceSchema = recurrenceSettingsSchema
  .extend({
    student_id: scheduleFields.student_id,
    start_date: z.iso.date(),
  })
  .refine(({ start_date, end_date }) => !end_date || end_date >= start_date, {
    path: ["end_date"],
    message: "A data final deve ser igual ou posterior à data inicial.",
  });

export const lessonSchema = z.object({
  ...scheduleFields,
  starts_at: z.iso.datetime({ offset: true }),
  recurrence_id: z.uuid().nullish(),
  status: lessonStatusSchema.default("agendada"),
  rescheduled_from_id: z.uuid().nullish(),
});
