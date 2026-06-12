# Draft: rank.chapters.by.salience.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/harvest/rank.chapters.by.salience.helper.ts`

**Gap (feature 53):** Step 3 — spec 38 salience heuristic; 6–10 select; 6 minimum.

**Source:** `brioela-specs/38-food-time-machine.md` § Computation; `02-chapter-rules.md` § Floors

---

```typescript
import type { HarvestChapterCandidate } from '@brioela/shared/validator/harvest'
import { harvestChapterSalienceClass } from '@brioela/shared/constants/harvest'

const MIN_STRONG_CHAPTERS = 6
const MAX_CHAPTERS = 10
const STRONG_SALIENCE_FLOOR = 0.55

const salienceClassBoost = {
	high: 0.25,
	medium_high: 0.15,
	medium: 0.05,
} as const

export type RankHarvestChaptersResult =
	| { ok: true; selected: HarvestChapterCandidate[] }
	| { ok: false; reason: 'insufficient_strong_chapters'; strongCount: number }

export function rankChaptersBySalience(
	candidates: HarvestChapterCandidate[],
): RankHarvestChaptersResult {
	const scored = candidates
		.map((c) => ({
			candidate: c,
			score:
				c.salience + salienceClassBoost[harvestChapterSalienceClass[c.chapterType]],
		}))
		.sort((a, b) => b.score - a.score)

	const strong = scored.filter((s) => s.score >= STRONG_SALIENCE_FLOOR)

	if (strong.length < MIN_STRONG_CHAPTERS) {
		return { ok: false, reason: 'insufficient_strong_chapters', strongCount: strong.length }
	}

	const selected = strong.slice(0, MAX_CHAPTERS).map((s) => s.candidate)
	return { ok: true, selected }
}
```
