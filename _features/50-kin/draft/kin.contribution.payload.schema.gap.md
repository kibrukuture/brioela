# Draft: kin.contribution.payload.schema.ts (gap — file does not exist)

Target: `shared/validator/kin/kin.contribution.payload.schema.ts`

**Gap (feature 50):** Worker contribution boundary — strips identity; 7-day bucket only.

---

```typescript
import { z } from 'zod'

export const kinContributionPayloadSchema = z
	.object({
		clusterId: z.string().trim().min(1),
		productId: z.string().trim().min(1),
		bucketStartIso: z.string().datetime(),
		peakDeltaMgdl: z.number().finite(),
		timeToPeakMin: z.number().int().min(0).nullable(),
		auc: z.number().finite().nullable(),
		spikeAboveThreshold: z.boolean(),
		contributionToken: z.string().trim().min(1),
	})
	.strict()

export type KinContributionPayload = z.infer<typeof kinContributionPayloadSchema>

/** Reject any extra keys — especially user_id */
export const kinContributionForbiddenKeys = ['userId', 'user_id', 'windowId', 'window_id'] as const
```
