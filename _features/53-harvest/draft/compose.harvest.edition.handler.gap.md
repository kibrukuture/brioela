# Draft: compose.harvest.edition.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/compose.harvest.edition.handler.ts`

**Gap (feature 53):** Full six-step composition orchestrator.

**Source:** `build-guide/36-harvest/01-composition-workflow.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { checkHarvestEligibility } from '@/agents/brain/_handlers/harvest/check.harvest.eligibility.handler'
import { gatherHarvestData } from '@/agents/brain/_handlers/harvest/gather.harvest.data.handler'
import { buildHarvestChapterCandidates } from '@/agents/brain/_handlers/harvest/build.chapter.candidates.handler'
import { rankChaptersBySalience } from '@/agents/brain/_helpers/harvest/rank.chapters.by.salience.helper'
import { writeHarvestNarrative } from '@/agents/brain/_handlers/harvest/write.harvest.narrative.handler'
import { composeHarvestGrammarDocuments } from '@/agents/brain/_handlers/harvest/compose.harvest.grammar.documents.handler'
import { preRenderHarvestShareCards } from '@/agents/brain/_handlers/harvest/pre.render.harvest.share.cards.handler'
import { storeHarvestEdition } from '@/agents/brain/_handlers/harvest/store.harvest.edition.handler'
import { triggerHarvestEditionNotification } from '@/agents/brain/_handlers/harvest/trigger.harvest.edition.notification.handler'

export type ComposeHarvestEditionResult =
	| { composed: true; editionId: string }
	| { composed: false; reason: string }

export async function composeHarvestEdition(
	db: BrainDatabase,
	userId: string,
	accountCreatedAt: number,
): Promise<ComposeHarvestEditionResult> {
	const eligibility = await checkHarvestEligibility(db, userId, accountCreatedAt)
	if (!eligibility.eligible) {
		return { composed: false, reason: eligibility.reason }
	}

	const { window } = eligibility
	const editionId = `harvest:${userId}:${window.yearIndex}`

	const gather = await gatherHarvestData(db, userId, window.periodStart, window.periodEnd)
	const candidates = await buildHarvestChapterCandidates(db, userId, gather)
	const ranked = rankChaptersBySalience(candidates)

	if (!ranked.ok) {
		return { composed: false, reason: ranked.reason }
	}

	const narrative = await writeHarvestNarrative(ranked.selected)
	if (narrative.length < 6) {
		return { composed: false, reason: 'narrative_validation_pruned_below_floor' }
	}

	const documentSet = await composeHarvestGrammarDocuments(editionId, narrative)
	const shareCards = await preRenderHarvestShareCards(userId, editionId, documentSet)

	await storeHarvestEdition(db, {
		editionId,
		userId,
		yearIndex: window.yearIndex,
		periodStart: window.periodStart,
		periodEnd: window.periodEnd,
		documentSet,
		narrativeChapters: narrative,
		coverShareCardRef: shareCards.coverShareCardRef,
		chapterShareCardRefs: shareCards.chapterShareCardRefs,
	})

	await triggerHarvestEditionNotification(db, userId, editionId)

	return { composed: true, editionId }
}
```
