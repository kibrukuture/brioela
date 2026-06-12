# Draft: request.discovery.card.schema.ts (gap — file does not exist)

Target: `shared/validator/viral.sharing/request.discovery.card.schema.ts`

**Gap (feature 51):** API + mobile preview request body.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`

---

```typescript
import { z } from 'zod'
import {
	brioelaMomentEntityKindValues,
	brioelaMomentSensitivityValues,
	brioelaMomentSourceFeatureValues,
} from './brioela.moment.schema'
import { discoveryCardTypeValues } from '@brioela/shared/constants/viral.sharing/discovery.card.type.constant'

export const requestDiscoveryCardSchema = z.object({
	momentId: z.string().min(1),
	kind: z.string().min(1),
	sourceFeature: z.enum(brioelaMomentSourceFeatureValues),
	entityKind: z.enum(brioelaMomentEntityKindValues),
	entityId: z.string().min(1),
	suggestedCardType: z.enum(discoveryCardTypeValues),
	sensitivity: z.enum(brioelaMomentSensitivityValues),
	rawPayload: z.record(z.string(), z.unknown()),
})
export type RequestDiscoveryCardInput = z.infer<typeof requestDiscoveryCardSchema>
```
