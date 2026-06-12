# Draft: build.sift.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/sift/build.sift.context.helper.ts`

**Gap (feature 32):** Assembles private food history + shared recall/community reads.

---

```typescript
import { and, eq, gte, lte, or } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { AppContext } from '@/types'
import { memoryEvents } from '@/agents/brain/_schemas/memory.event.schema'
import { recallEntries } from '@shared/drizzle/schema/recall.schema'
import { communityIllnessSignals } from '@shared/drizzle/schema/community.illness.schema'
import type { LookbackWindow } from './compute.lookback.window.helper'

const FOOD_EVENT_KINDS = [
	'product_scanned',
	'receipt_ingested',
	'recipe_cooked',
	'meal_logged',
	'place_visited',
] as const

export type SiftContext = {
	window: LookbackWindow
	foodEvents: Array<typeof memoryEvents.$inferSelect>
	activeRecalls: Array<typeof recallEntries.$inferSelect>
	communitySignals: Array<typeof communityIllnessSignals.$inferSelect>
}

export async function buildSiftContext(
	database: BrainDatabase,
	ctx: AppContext,
	userId: string,
	window: LookbackWindow,
): Promise<SiftContext> {
	const foodEvents = await database
		.select()
		.from(memoryEvents)
		.where(
			and(
				eq(memoryEvents.userId, userId),
				gte(memoryEvents.capturedAt, window.windowStart),
				lte(memoryEvents.capturedAt, window.windowEnd),
			),
		)
		.orderBy(memoryEvents.capturedAt)

	const productIds = [
		...new Set(
			foodEvents
				.map((e) => e.entityId)
				.filter((id): id is string => Boolean(id)),
		),
	]

	const activeRecalls =
		productIds.length === 0
			? []
			: await ctx.db
					.select()
					.from(recallEntries)
					.where(
						and(
							eq(recallEntries.status, 'active'),
							or(...productIds.map((id) => eq(recallEntries.upc, id))),
						),
					)

	const communitySignals = await ctx.db.select().from(communityIllnessSignals).where(
		or(
			...productIds.map((id) => eq(communityIllnessSignals.productId, id)),
		),
	)

	return {
		window,
		foodEvents: foodEvents.filter((e) =>
			(FOOD_EVENT_KINDS as readonly string[]).includes(e.kind),
		),
		activeRecalls,
		communitySignals,
	}
}
```

Optional v2: join `health_events` GI rows and `health_captures` wearable summaries (**22**/**36**).
