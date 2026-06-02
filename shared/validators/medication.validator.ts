// shared/validators/medication.ts
import { z } from "@schnl/shared/zod";

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
});
