# Draft: build.chapter.candidates.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/build.chapter.candidates.handler.ts`

**Gap (feature 53):** Step 2 — typed candidates + exclusion + optional craft from **40**.

**Source:** `build-guide/36-harvest/02-chapter-rules.md`, `01-composition-workflow.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { HarvestGatherBundle } from '@/agents/brain/_handlers/harvest/gather.harvest.data.handler'
import type { HarvestChapterCandidate } from '@brioela/shared/validator/harvest'
import { buildChapterCandidatesFromGather } from '@/agents/brain/_helpers/harvest/build.chapter.candidates.helper'
import { filterHarvestCandidates } from '@/agents/brain/_policies/harvest/sensitivity.exclusion.policy'
import { loadCraftChapterCandidate } from '@/agents/brain/_handlers/growth-mirror/load.craft.chapter.candidate.handler'

export async function buildHarvestChapterCandidates(
	db: BrainDatabase,
	userId: string,
	gather: HarvestGatherBundle,
): Promise<HarvestChapterCandidate[]> {
	const raw = buildChapterCandidatesFromGather(gather)

	const craft = await loadCraftChapterCandidate(
		db,
		userId,
		gather.periodStart,
		gather.periodEnd,
	)

	if (craft) {
		raw.push({
			candidateId: `craft:${craft.dimension}`,
			chapterType: 'craft',
			salience: craft.confidence,
			headlineSeed: craft.headlineSeed,
			sourceQueries: craft.evidenceRefs.map((ref, i) => ({
				queryId: `skill_trajectory.evidence.${i}`,
				description: `Skill evidence ref for ${craft.dimension}`,
				result: ref,
			})),
			entityKind: 'skill',
			entityId: craft.dimension,
		})
	}

	return filterHarvestCandidates(raw)
}
```
