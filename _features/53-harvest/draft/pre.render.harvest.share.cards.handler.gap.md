# Draft: pre.render.harvest.share.cards.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/pre.render.harvest.share.cards.handler.ts`

**Gap (feature 53):** Step 6 — pre-render static share cards via **52** Artifact Layer.

**Source:** `build-guide/36-harvest/04-share-cards.md`

---

```typescript
import type { HarvestDocumentSet } from '@/agents/brain/_handlers/harvest/compose.harvest.grammar.documents.handler'
import { renderHarvestChapterShareCard } from '@/core/generative-grammar/render-harvest-chapter-document'
import { uploadUserScopedObject } from '@/agents/brain/_helpers/r2/upload.user.scoped.object.helper'

export type PreRenderHarvestShareCardsResult = {
	coverShareCardRef: string | null
	chapterShareCardRefs: Map<string, string | null>
}

export async function preRenderHarvestShareCards(
	userId: string,
	editionId: string,
	documentSet: HarvestDocumentSet,
): Promise<PreRenderHarvestShareCardsResult> {
	const chapterShareCardRefs = new Map<string, string | null>()

	for (const chapter of documentSet.chapters) {
		const targetKey = `harvest/${userId}/${editionId}/${chapter.chapterId}.png`
		const rendered = await renderHarvestChapterShareCard({
			chapterDocument: chapter.document,
			shareCardRefTarget: targetKey,
		})

		if (!rendered) {
			chapterShareCardRefs.set(chapter.chapterId, null)
			continue
		}

		const ref = await uploadUserScopedObject({
			userId,
			key: targetKey,
			bytes: rendered.bytes,
			mimeType: rendered.mimeType,
			stripExif: true,
		})

		chapterShareCardRefs.set(chapter.chapterId, ref)
	}

	const coverKey = `harvest/${userId}/${editionId}/cover.png`
	const coverRendered = await renderHarvestChapterShareCard({
		chapterDocument: documentSet.cover,
		shareCardRefTarget: coverKey,
	})

	const coverShareCardRef = coverRendered
		? await uploadUserScopedObject({
				userId,
				key: coverKey,
				bytes: coverRendered.bytes,
				mimeType: coverRendered.mimeType,
				stripExif: true,
			})
		: null

	return { coverShareCardRef, chapterShareCardRefs }
}
```
