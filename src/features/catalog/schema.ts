import { z } from "zod";

export const catalogTableSchema = z.enum(["subjects", "grades"]);
export type CatalogTable = z.infer<typeof catalogTableSchema>;

export const catalogNameMaxLength = 100;
export const catalogNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(catalogNameMaxLength);
