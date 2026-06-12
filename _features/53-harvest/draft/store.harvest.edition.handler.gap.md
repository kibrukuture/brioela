# Draft: store.harvest.edition.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/store.harvest.edition.handler.ts`

**Gap (feature 53):** Persist edition + chapter rows.

**Source:** `build-guide/36-harvest/03-grammar-rendering.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { harvestEditions } from '@/agents/brain/_schemas/harvest.edition.schema'
import { harvestChapters } from '@/agents/brain/_schemas/harvest.chapter.schema'
import type { HarvestDocumentSet } from '@/agents/brain/_handlers/harvest/compose.harvest.grammar.documents.handler'
import type { NarrativeChapter } from '@/agents/brain/_handlers/harvest/write.harvest.narrative.handler'

export type StoreHarvestEditionInput = {
	editionId: string
	userId: string
	yearIndex: number
	periodStart: number
	periodEnd: number
	documentSet: HarvestDocumentSet
	narrativeChapters: NarrativeChapter[]
	coverShareCardRef: string | null
	chapterShareCardRefs: Map<string, string | null>
}

export async function storeHarvestEdition(
	db: BrainDatabase,
	input: StoreHarvestEditionInput,
): Promise<void> {
	const now = Date.now()

	const documentSetJson = JSON.stringify({
		chapters: input.documentSet.chapters.map((c) => ({
			chapterId: c.chapterId,
			document: c.document,
		})),
		cover: input.documentSet.cover,
	})

	await db.insert(harvestEditions).values({
		editionId: input.editionId,
		userId: input.userId,
		yearIndex: input.yearIndex,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		chapterCount: input.narrativeChapters.length,
		documentSetJson,
		coverShareCardRef: input.coverShareCardRef,
		generatedAt: now,
		openedAt: null,
	})

	for (const [rank, narrative] of input.narrativeChapters.entries()) {
		const chapterId = `${input.editionId}:ch:${rank}`
		const shareCardRef = input.chapterShareCardRefs.get(chapterId) ?? null

		await db.insert(harvestChapters).values({
			chapterId,
			editionId: input.editionId,
			chapterType: narrative.chapterType,
			headline: narrative.headline,
			body: narrative.body,
			sourceQueriesJson: narrative.sourceQueriesJson,
			shareCardRef,
			shared: false,
			rank,
		})
	}
}
```
