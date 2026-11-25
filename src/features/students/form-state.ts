import type { z } from "zod";
import type { GuardianFormState } from "@/features/guardians/schema";
import type { studentFormSchema } from "./schema";

export type StudentFormValues = z.input<typeof studentFormSchema> & {
  guardian_consent_confirmed?: boolean;
};
export type StudentFormState = {
  values: StudentFormValues;
  errors?: Partial<Record<keyof StudentFormValues, string[]>>;
  guardian?: GuardianFormState;
  message?: string;
  attempt: number;
};

export const initialStudentGuardian: GuardianFormState = {
  values: { name: "", phone: "", relationship: "", financial: true },
  attempt: 0,
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
