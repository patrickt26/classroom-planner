export type LessonFormValues = {
  student_id: string;
  subject_id: string;
  date: string;
  time: string;
  duration_minutes: string;
  modality: string;
  meeting_url: string;
  status: string;
  repeat_weekly: string;
  end_date: string;
};

export type LessonDay = Omit<LessonFormValues, "student_id">;
export type LessonFieldErrors = Partial<
  Record<keyof LessonFormValues, string[]>
>;

export type LessonFormState = {
  message?: string;
  studentError?: string;
  days?: Record<
    string,
    { conflict?: boolean; message?: string; fields?: LessonFieldErrors }
  >;
};

export const lessonStatusLabels = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  falta: "Falta",
  reposicao_pendente: "Reposição pendente",
} as const;

export const lessonModalityLabels = {
  presencial: "Presencial",
  online: "Online",
} as const;
