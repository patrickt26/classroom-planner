import { z } from "zod";

export const lessonPlanSchema = z.object({
  objective: z.string().trim().min(1).max(2000),
  content: z.string().trim().max(4000),
  activities: z.string().trim().max(4000),
  materials: z.string().trim().max(4000),
});

export type LessonPlanValues = z.infer<typeof lessonPlanSchema>;

export type LessonPlanState = {
  values: LessonPlanValues;
  attempt: number;
  message?: string;
};
