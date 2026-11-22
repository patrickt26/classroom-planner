import { z } from "zod";
import type { Enums } from "@/types/database";

export const methodLabels = {
  pix: "Pix",
  cash: "Dinheiro",
  transfer: "Transferência",
  other: "Outro",
} satisfies Record<Enums<"payment_method">, string>;

export const paymentSchema = z.object({
  studentId: z.uuid(),
  lessonIds: z
    .array(z.uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length),
  paidOn: z.iso.date(),
  method: z.enum(["pix", "cash", "transfer", "other"]),
  note: z.string().trim().max(1000),
});
