# Draft: share.moment.score.schema.ts (gap — file does not exist)

Target: `shared/validator/viral.sharing/share.moment.score.schema.ts`

**Gap (feature 51):** Scoring struct from taxonomy.

**Source:** `build-guide/24-viral-sharing/01-shareable-moment-taxonomy.md`

---

```typescript
import { z } from 'zod'

export const shareMomentScoreSchema = z.object({
	surprise: z.number().min(0).max(1),
	usefulness: z.number().min(0).max(1),
	emotionalWeight: z.number().min(0).max(1),
	privacyRisk: z.number().min(0).max(1),
	confidence: z.number().min(0).max(1),
	finalScore: z.number(),
})
export type ShareMomentScore = z.infer<typeof shareMomentScoreSchema>
```
