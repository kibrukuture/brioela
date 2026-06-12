# Draft: kin.fingerprint.vector.schema.ts (gap — file does not exist)

Target: `shared/validator/kin/kin.fingerprint.vector.schema.ts`

**Gap (feature 50):** Typed fingerprint stored in Brain `kin_state.fingerprint_json` only.

---

```typescript
import { z } from 'zod'

export const kinReferenceCategoryValues = [
	'refined_carbs',
	'white_rice',
	'fruit_juice',
	'bread',
] as const

export const kinFingerprintVectorSchema = z.object({
	version: z.literal(1),
	referenceCategoryPeakDeltas: z.record(
		z.enum(kinReferenceCategoryValues),
		z.number().nullable(),
	),
	typicalTimeToPeakMin: z.number().nullable(),
	typicalReturnToBaselineMin: z.number().nullable(),
	fastingBaselineBandMgdl: z
		.object({ low: z.number(), high: z.number() })
		.nullable(),
	responseVariance: z.enum(['stable', 'volatile', 'unknown']),
	windowCount: z.number().int().min(0),
})

export type KinFingerprintVector = z.infer<typeof kinFingerprintVectorSchema>
```
