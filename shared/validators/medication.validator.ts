// shared/validators/medication.ts
import { z } from "@brioela/shared/zod";

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
});
