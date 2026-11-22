import { z } from "zod";

export const lessonNoteLimit = 4000;
export const lessonNoteFields = [
  { name: "worked_on", label: "O que foi trabalhado" },
  { name: "difficulties", label: "Dificuldades" },
  { name: "next_steps", label: "Próximos passos" },
] as const;

const noteText = z.string().trim().max(lessonNoteLimit);

export const lessonNoteSchema = z.object({
  worked_on: noteText.min(1),
  difficulties: noteText,
  next_steps: noteText,
});

export type LessonNoteValues = z.input<typeof lessonNoteSchema>;

export type LessonNoteState = {
  values: LessonNoteValues;
  attempt: number;
  message?: string;
};
