# Draft: write.harvest.narrative.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/write.harvest.narrative.handler.ts`

**Gap (feature 53):** Step 4 — one structured LLM call for chapter copy.

**Source:** `brioela-specs/49-harvest.md` § Composition step 4, `02-chapter-rules.md` § Copy Rules

---

```typescript
import type { HarvestChapterCandidate } from '@brioela/shared/validator/harvest'
import { harvestNarrativeOutputSchema } from '@brioela/shared/validator/harvest/harvest.narrative.output.schema'
import { validateSourceQueriesForChapter } from '@/agents/brain/_helpers/harvest/validate.source.queries.helper'
import { buildHarvestNarrativePrompt } from '@/agents/brain/_helpers/harvest/build.harvest.narrative.prompt.helper'
import { presentMoment } from '@/core/generative-grammar/present-moment'

export type NarrativeChapter = {
	candidateId: string
	chapterType: HarvestChapterCandidate['chapterType']
	headline: string
	body: string
	sourceQueriesJson: string
}

export async function writeHarvestNarrative(
	candidates: HarvestChapterCandidate[],
): Promise<NarrativeChapter[]> {
	const prompt = buildHarvestNarrativePrompt(candidates)

	const result = await presentMoment({
		schema: harvestNarrativeOutputSchema,
		prompt,
		surface: 'harvest_narrative_internal',
	})

	const chapters: NarrativeChapter[] = []

	for (const chapter of result.chapters) {
		const candidate = candidates.find((c) => c.candidateId === chapter.candidateId)
		if (!candidate) {
			continue
		}

		const validated = validateSourceQueriesForChapter(
			chapter.headline,
			chapter.body,
			candidate.sourceQueries,
		)

		if (!validated.ok) {
			continue
		}

		chapters.push({
			candidateId: chapter.candidateId,
			chapterType: candidate.chapterType,
			headline: validated.chapter.headline,
			body: validated.chapter.body,
			sourceQueriesJson: JSON.stringify(validated.chapter.sourceQueries),
		})
	}

	return chapters
}
```
