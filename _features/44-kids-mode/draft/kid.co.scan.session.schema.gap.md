# Draft: kid.co.scan.session.schema.ts (gap — file does not exist)

Target: `shared/validator/kids.mode/kid.co.scan.session.schema.ts`

**Gap:** No co-scan session contract.

**Source:** `build-guide/21-kids-mode/07-kid-co-scan-mode.md`

---

```typescript
import { z } from 'zod'
import { kidsModeAgeRangeSchema } from './kids.scan.explanation.schema'

export const kidCoScanStatusSchema = z.enum(['active', 'ended'])
export type KidCoScanStatus = z.infer<typeof kidCoScanStatusSchema>

export const kidCoScanSessionSchema = z.object({
	sessionId: z.string().min(1),
	userId: z.string().min(1),
	ageRange: kidsModeAgeRangeSchema,
	startedAt: z.number().int().nonnegative(),
	endedAt: z.number().int().nonnegative().nullable(),
	status: kidCoScanStatusSchema,
	scanCount: z.number().int().nonnegative(),
})
export type KidCoScanSession = z.infer<typeof kidCoScanSessionSchema>

export const startKidCoScanInputSchema = z.object({
	ageRange: kidsModeAgeRangeSchema.optional(),
	voiceEnabled: z.boolean().default(true),
})
export type StartKidCoScanInput = z.infer<typeof startKidCoScanInputSchema>
```
