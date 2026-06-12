# Draft: compose.harvest.grammar.documents.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/compose.harvest.grammar.documents.handler.ts`

**Gap (feature 53):** Step 5 — grammar document set per chapter + cover (**52** compose/validate).

**Source:** `build-guide/36-harvest/03-grammar-rendering.md`

---

```typescript
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import type { NarrativeChapter } from '@/agents/brain/_handlers/harvest/write.harvest.narrative.handler'
import { composeBrioelaGenerativeUi } from '@/core/generative-grammar/compose-brioela-generative-ui'
import { validateBrioelaGenerativeUi } from '@/core/generative-grammar/validate-brioela-generative-ui'
import { buildHarvestGrammarPrompt } from '@/agents/brain/_helpers/harvest/build.harvest.grammar.prompt.helper'

export type HarvestDocumentSet = {
	chapters: Array<{
		chapterId: string
		chapterType: NarrativeChapter['chapterType']
		document: BrioelaGenerativeUiDocument
	}>
	cover: BrioelaGenerativeUiDocument
}

export async function composeHarvestGrammarDocuments(
	editionId: string,
	narrativeChapters: NarrativeChapter[],
): Promise<HarvestDocumentSet> {
	const chapterDocs: HarvestDocumentSet['chapters'] = []

	for (const [index, chapter] of narrativeChapters.entries()) {
		const chapterId = `${editionId}:ch:${index}`

		const composed = await composeBrioelaGenerativeUi({
			surface: 'harvest_chapter_brioela_generative_ui',
			prompt: buildHarvestGrammarPrompt(chapter),
			safetyLock: false,
		})

		const validated = validateBrioelaGenerativeUi(composed.document)
		const document = validated.ok
			? validated.document
			: buildTypographicFallbackDocument(chapter, 'harvest_chapter_brioela_generative_ui')

		chapterDocs.push({
			chapterId,
			chapterType: chapter.chapterType,
			document,
		})
	}

	const coverComposed = await composeBrioelaGenerativeUi({
		surface: 'harvest_cover_brioela_generative_ui',
		prompt: buildHarvestGrammarPrompt({
			headline: `Your Harvest — year ${editionId}`,
			body: `${narrativeChapters.length} chapters from your year in food`,
			chapterType: 'rhythm',
			candidateId: 'cover',
			sourceQueriesJson: '[]',
		}),
		safetyLock: false,
	})

	const coverValidated = validateBrioelaGenerativeUi(coverComposed.document)
	const cover = coverValidated.ok
		? coverValidated.document
		: buildTypographicFallbackDocument(
				{
					headline: 'Your Harvest is ready',
					body: '',
					chapterType: 'rhythm',
					candidateId: 'cover',
					sourceQueriesJson: '[]',
				},
				'harvest_cover_brioela_generative_ui',
			)

	return { chapters: chapterDocs, cover }
}

function buildTypographicFallbackDocument(
	chapter: NarrativeChapter,
	surface: BrioelaGenerativeUiDocument['surface'],
): BrioelaGenerativeUiDocument {
	return {
		grammarVersion: '1',
		surface,
		safetyLock: false,
		expiresAt: null,
		emotionalTone: 'memory_reflective',
		backgroundEffect: null,
		layoutTemplate: { type: 'harvest_chapter_story_layout' },
		content: {
			headline: chapter.headline,
			body: chapter.body,
		},
		entranceMotion: null,
		typographyStyle: 'editorial',
	}
}
```
