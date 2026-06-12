# Draft: score.share.moment.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/viral.sharing/score.share.moment.helper.ts`

**Gap (feature 51):** Moment threshold before offering share UI.

**Source:** `build-guide/24-viral-sharing/01-shareable-moment-taxonomy.md`

---

```typescript
import type { BrioelaMoment } from '@brioela/shared/validator/viral.sharing/brioela.moment.schema'
import type { ShareMomentScore } from '@brioela/shared/validator/viral.sharing/share.moment.score.schema'
import {
	SHARE_MOMENT_CONFIDENCE_FLOOR,
	SHARE_MOMENT_FINAL_SCORE_FLOOR,
} from '@brioela/shared/constants/viral.sharing/share.moment.threshold.constant'

type ScoreInput = {
	moment: BrioelaMoment
	surprise: number
	usefulness: number
	emotionalWeight: number
	confidence: number
}

export function scoreShareMoment(input: ScoreInput): ShareMomentScore {
	const privacyRisk = sensitivityToPrivacyRisk(input.moment.sensitivity)
	const finalScore =
		input.surprise * 0.3 +
		input.usefulness * 0.25 +
		input.emotionalWeight * 0.25 +
		input.confidence * 0.2 -
		privacyRisk * 0.4

	return {
		surprise: input.surprise,
		usefulness: input.usefulness,
		emotionalWeight: input.emotionalWeight,
		privacyRisk,
		confidence: input.confidence,
		finalScore,
	}
}

export function shouldOfferSharePrompt(score: ShareMomentScore): boolean {
	if (score.finalScore < SHARE_MOMENT_FINAL_SCORE_FLOOR) return false
	if (score.confidence < SHARE_MOMENT_CONFIDENCE_FLOOR) return false
	if (score.privacyRisk > 0.7) return false
	return true
}

function sensitivityToPrivacyRisk(
	sensitivity: BrioelaMoment['sensitivity'],
): number {
	switch (sensitivity) {
		case 'public_safe':
			return 0
		case 'needs_review':
			return 0.4
		case 'sensitive':
			return 0.7
		case 'blocked':
			return 1
	}
}
```
