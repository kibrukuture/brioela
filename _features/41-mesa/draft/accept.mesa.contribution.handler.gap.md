# Draft: accept.mesa.contribution.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/mesa/accept.mesa.contribution.handler.ts`

**Gap:** No owner review/accept path for contributor events.

**Source:** `build-guide/26-mesa/07-shared-enrichment-and-invites.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaContributionEvent } from '@/agents/brain/_schemas/mesa.contribution.event.schema'
import { applyMesaPantryEnrichment } from '@/agents/brain/_handlers/mesa/apply.mesa.pantry.enrichment.helper'
import { eq } from 'drizzle-orm'

export async function acceptMesaContribution(
	db: BrainDatabase,
	ownerUserId: string,
	contributionId: string,
): Promise<{ accepted: boolean }> {
	const row = await db
		.select()
		.from(mesaContributionEvent)
		.where(eq(mesaContributionEvent.id, contributionId))
		.get()

	if (!row) {
		return { accepted: false }
	}

	await db
		.update(mesaContributionEvent)
		.set({ acceptedByOwner: true })
		.where(eq(mesaContributionEvent.id, contributionId))

	if (row.entityKind === 'pantry_item') {
		await applyMesaPantryEnrichment(db, ownerUserId, row)
	}

	return { accepted: true }
}
```
