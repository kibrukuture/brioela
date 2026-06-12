# Draft: run.sift.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_schemas/run.sift.schema.ts`

**Gap (feature 32):** Input schema for `run_sift(symptom_onset_hours)` per `brioela-specs/09-per-user-brain.md`.

---

```typescript
import { z } from 'zod'

export const runSiftSchema = z.object({
	symptomOnsetHours: z
		.number()
		.positive()
		.max(72)
		.describe('Hours since symptom onset — drives lookback window.'),
	reportId: z
		.string()
		.optional()
		.describe('Existing open report to continue; omit to start new Sift.'),
	followupAnswers: z
		.object({
			othersSick: z.boolean().optional(),
			fullyCooked: z.boolean().optional(),
		})
		.optional(),
})

export type RunSiftInput = z.infer<typeof runSiftSchema>
```
