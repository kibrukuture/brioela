# Draft: render-harvest-chapter-document.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/render-harvest-chapter-document.ts`

**Gap (feature 52):** Render pre-composed Harvest chapter documents — no 400ms gate.

**Source:** `36-harvest/03-grammar-rendering.md`, `04-share-cards.md`

---

```typescript
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import { validateBrioelaGenerativeUi } from './validate-brioela-generative-ui'
import { renderArtifactStatic } from './render-artifact-static'

export type HarvestChapterDocumentSet = {
	editionId: string
	chapters: Array<{
		chapterId: string
		document: BrioelaGenerativeUiDocument
	}>
}

export type RenderHarvestChapterInput = {
	chapterDocument: BrioelaGenerativeUiDocument
	shareCardRefTarget: string
}

/**
 * Harvest stores documents at compose time. Opening renders instantly.
 * Share card pre-rendered at composition step 6 — **53** owns salience/copy.
 */
export async function renderHarvestChapterShareCard(
	input: RenderHarvestChapterInput,
): Promise<{ bytes: Uint8Array; mimeType: 'image/png' } | null> {
	const validated = validateBrioelaGenerativeUi(input.chapterDocument)
	if (!validated.ok) {
		// fallback: plain typographic render of chapter text (36-harvest/03)
		return null
	}

	if (validated.document.surface !== 'harvest_chapter_brioela_generative_ui') {
		return null
	}

	const artifact = await renderArtifactStatic({
		document: validated.document,
		format: 'png',
		widthPx: 1080,
		heightPx: 1920,
	})

	if (!artifact) {
		return null
	}

	return { bytes: artifact.bytes, mimeType: 'image/png' }
}
```
