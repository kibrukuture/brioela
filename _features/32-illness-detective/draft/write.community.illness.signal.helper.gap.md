# Draft: write.community.illness.signal.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/sift/write.community.illness.signal.helper.ts`

**Source:** `build-guide/16-illness-detective/04-community-signal.md`, spec 30 privacy rules.

**Critical:** Strip all user identifiers before Supabase write. Round timestamps to 24h buckets.

---

```typescript
import { createId } from '@brioela/shared/_ids'
import { sql } from 'drizzle-orm'
import type { AppContext } from '@/types'
import { communityIllnessSignals } from '@shared/drizzle/schema/community.illness.schema'

const ELEVATION_THRESHOLD = 3
const ELEVATION_WINDOW_MS = 72 * 60 * 60 * 1000

export type CommunityIllnessWriteInput = {
	productId?: string
	restaurantId?: string
	reportedAtMs: number
}

function roundToDayStart(ms: number): Date {
	const d = new Date(ms)
	d.setUTCHours(0, 0, 0, 0)
	return d
}

export async function writeCommunityIllnessSignal(
	ctx: AppContext,
	input: CommunityIllnessWriteInput,
): Promise<{ signalId: string; elevated: boolean }> {
	if (!input.productId && !input.restaurantId) {
		throw new Error('community illness signal requires productId or restaurantId')
	}

	const windowStart = roundToDayStart(input.reportedAtMs)
	const windowEnd = new Date(windowStart.getTime() + ELEVATION_WINDOW_MS)

	const signalId = createId()

	const [row] = await ctx.db
		.insert(communityIllnessSignals)
		.values({
			id: signalId,
			productId: input.productId ?? null,
			restaurantId: input.restaurantId ?? null,
			signalCount: 1,
			windowStart,
			windowEnd,
			elevated: false,
		})
		.onConflictDoUpdate({
			target: input.productId
				? [communityIllnessSignals.productId, communityIllnessSignals.windowStart]
				: [communityIllnessSignals.restaurantId, communityIllnessSignals.windowStart],
			set: {
				signalCount: sql`${communityIllnessSignals.signalCount} + 1`,
				updatedAt: new Date(),
			},
		})
		.returning()

	const elevated = (row?.signalCount ?? 1) >= ELEVATION_THRESHOLD

	if (elevated && row && !row.elevated) {
		await ctx.db
			.update(communityIllnessSignals)
			.set({ elevated: true, updatedAt: new Date() })
			.where(sql`${communityIllnessSignals.id} = ${row.id}`)
	}

	return { signalId: row?.id ?? signalId, elevated }
}
```

**Not in scope:** Authority export — separate opt-in gate (`check.authority.export.optin.helper.ts`). **22** community health tables are never written from this path.
