import { z } from "zod";
import { legalVersion } from "./version";

export const acceptanceSchema = z.object({
  accepted: z.literal("on"),
  version: z.literal(legalVersion),
});
