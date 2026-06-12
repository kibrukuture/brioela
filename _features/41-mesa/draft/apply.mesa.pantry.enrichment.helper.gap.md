# Draft: apply.mesa.pantry.enrichment.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/mesa/apply.mesa.pantry.enrichment.helper.ts`

**Gap:** No bridge from accepted `pantry_item` contributions to **34** read path.

**Source:** `build-guide/26-mesa/07-shared-enrichment-and-invites.md`, `_features/34-pantry-meal-plan/spec.md` boundary

**Never:** Fork personal `inventory_item_estimate` into a duplicate Mesa pantry table.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { MesaContributionEventRow } from '@/agents/brain/_schemas/mesa.contribution.event.schema'

export type MesaPantryEnrichmentItem = {
	itemKey: string
	displayName: string
	sourceContributionId: string
	contributorUserId: string | null
	markedAt: number
}

export async function applyMesaPantryEnrichment(
	db: BrainDatabase,
	ownerUserId: string,
	contribution: MesaContributionEventRow,
): Promise<MesaPantryEnrichmentItem | null> {
	if (!contribution.acceptedByOwner) {
		return null
	}

	const payload = JSON.parse(contribution.payloadJson) as {
		itemKey: string
		displayName: string
	}

	// **34** reads accepted Mesa contributions when assembling inventory for Mesa meal plan.
	// No separate mesa_pantry table — contribution row is canonical shared object.
	return {
		itemKey: payload.itemKey,
		displayName: payload.displayName,
		sourceContributionId: contribution.id,
		contributorUserId: contribution.contributorUserId,
		markedAt: contribution.createdAt,
	}
}
```
