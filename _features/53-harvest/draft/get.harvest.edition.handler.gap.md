# Draft: get.harvest.edition.handler.ts (gap — file does not exist)

Target: `backend/src/api/harvest/_handlers/get.harvest.edition.handler.ts`

**Gap (feature 53):** Edition + chapters for mobile viewer (offline-capable local cache).

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { harvestEditions } from '@/agents/brain/_schemas/harvest.edition.schema'
import { harvestChapters } from '@/agents/brain/_schemas/harvest.chapter.schema'
import { and, eq, asc } from 'drizzle-orm'

export async function getHarvestEdition(
	db: BrainDatabase,
	userId: string,
	editionId: string,
) {
	const edition = await db
		.select()
		.from(harvestEditions)
		.where(and(eq(harvestEditions.editionId, editionId), eq(harvestEditions.userId, userId)))
		.get()

	if (!edition) {
		return null
	}

	const chapters = await db
		.select()
		.from(harvestChapters)
		.where(eq(harvestChapters.editionId, editionId))
		.orderBy(asc(harvestChapters.rank))
		.all()

	return {
		edition,
		chapters,
		documentSetJson: edition.documentSetJson,
	}
}
```
