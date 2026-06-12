# Draft: rank.sift.suspects.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/sift/rank.sift.suspects.handler.ts`

**Source:** spec 30 — structured LLM, not streaming; target <2s.

---

```typescript
import { generateObject } from 'ai'
import { siftResultSchema, type SiftResult } from '@shared/validator/sift/sift.result.schema'
import type { SiftContext } from './build.sift.context.helper'

const SIFT_SYSTEM_PROMPT = `You are Sift — Brioela's food illness investigator.
Rank up to 3 likely food suspects from the user's recent food history.
Never diagnose. Use "likely suspect" language only.
Weight active recalls highest, then community illness reports, then high-risk categories, new products, outside food.
If wearable context is provided, use it only as supporting evidence — never as proof of cause.`

export async function rankSiftSuspects(
	ctx: SiftContext,
	model: Parameters<typeof generateObject>[0]['model'],
): Promise<SiftResult> {
	const { object } = await generateObject({
		model,
		schema: siftResultSchema,
		system: SIFT_SYSTEM_PROMPT,
		prompt: JSON.stringify({
			window: ctx.window,
			foodEvents: ctx.foodEvents.map((e) => ({
				kind: e.kind,
				capturedAt: e.capturedAt,
				entityKind: e.entityKind,
				entityId: e.entityId,
				payload: e.payloadJson,
			})),
			activeRecalls: ctx.activeRecalls.map((r) => ({
				id: r.id,
				productName: r.productName,
				reason: r.reason,
			})),
			communitySignals: ctx.communitySignals.map((s) => ({
				productId: s.productId,
				restaurantId: s.restaurantId,
				signalCount: s.signalCount,
				elevated: s.elevated,
			})),
		}),
	})

	return object
}
```

On Zod validation failure, fall back to rule-based ordering (recall matches first).
