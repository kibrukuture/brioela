# Draft: detect.cooking.intent.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/bela/detect.cooking.intent.helper.ts`

**Source:** `implementable-specs/bela/10-cooking-intent-trigger.md`

**Gap:** Requires new `cooking_intent` memory_event kind in **01-memory-event**.

---

```typescript
import { z } from 'zod'

export const cookingIntentPayloadSchema = z.object({
	dish: z.string().min(1),
	timeframe: z.string().nullable(),
	confidence: z.number().min(0).max(1),
})

export type CookingIntentPayload = z.infer<typeof cookingIntentPayloadSchema>

const NEAR_TERM_CONFIDENCE_THRESHOLD = 0.7

export function shouldOfferBelaOrderFromIntent(payload: CookingIntentPayload): boolean {
	if (payload.confidence < NEAR_TERM_CONFIDENCE_THRESHOLD) return false
	if (payload.timeframe?.toLowerCase().includes('someday')) return false
	return true
}

export function buildCookingIntentMemoryEvent(
	payload: CookingIntentPayload,
	sessionId: string | null,
): {
	kind: 'cooking_intent'
	payloadJson: CookingIntentPayload
	sessionId: string | null
} {
	return {
		kind: 'cooking_intent',
		payloadJson: payload,
		sessionId,
	}
}
```
