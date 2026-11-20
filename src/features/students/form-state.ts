import type { z } from "zod";
import type { studentFormSchema } from "./schema";

export type StudentFormValues = z.input<typeof studentFormSchema>;
export type StudentFormState = {
  values: StudentFormValues;
  errors?: Partial<Record<keyof StudentFormValues, string[]>>;
  message?: string;
  attempt: number;
};

export const emptyStudentForm: StudentFormValues = {
  name: "",
  birth_date: "",
  grade_id: "",
  school: "",
  hourly_rate: "",
  is_free: false,
  notes: "",
  subject_ids: [],
};

export const formatReais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
