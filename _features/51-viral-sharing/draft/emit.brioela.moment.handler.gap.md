# Draft: emit.brioela.moment.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/viral.sharing/emit.brioela.moment.handler.ts`

**Gap (feature 51):** Feature RPC entry for moment queue.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md` generation flow step 1

---

```typescript
import type { EmitBrioelaMomentInput } from '@brioela/shared/validator/viral.sharing/brioela.moment.schema'
import { emitBrioelaMomentInputSchema } from '@brioela/shared/validator/viral.sharing/brioela.moment.schema'
import { scoreShareMoment, shouldOfferSharePrompt } from '@/agents/brain/_helpers/viral.sharing/score.share.moment.helper'
import { shouldSuppressSharePrompt } from '@/agents/brain/_helpers/viral.sharing/should.suppress.share.prompt.helper'

export type EmitBrioelaMomentResult = {
	momentId: string
	offerShare: boolean
}

type Deps = {
	now: () => number
	readSuppression: (userId: string) => Promise<{ dismissCount7d: number; windowStartedAt: number; suppressedUntil: number | null } | null>
	insertOffer: (row: { offerId: string; momentId: string; cardType: string; status: 'offered' | 'blocked' }) => Promise<void>
	deriveScoreSignals: (input: EmitBrioelaMomentInput) => {
		surprise: number
		usefulness: number
		emotionalWeight: number
		confidence: number
	}
}

export async function emitBrioelaMomentHandler(
	userId: string,
	raw: EmitBrioelaMomentInput,
	deps: Deps,
): Promise<EmitBrioelaMomentResult> {
	const input = emitBrioelaMomentInputSchema.parse({
		...raw,
		createdAt: deps.now(),
	})

	if (input.sensitivity === 'blocked') {
		return { momentId: input.momentId, offerShare: false }
	}

	const suppression = await deps.readSuppression(userId)
	if (shouldSuppressSharePrompt(suppression, deps.now())) {
		return { momentId: input.momentId, offerShare: false }
	}

	const signals = deps.deriveScoreSignals(input)
	const score = scoreShareMoment({ moment: { ...input, createdAt: deps.now() }, ...signals })
	const offerShare = shouldOfferSharePrompt(score)

	if (offerShare) {
		await deps.insertOffer({
			offerId: crypto.randomUUID(),
			momentId: input.momentId,
			cardType: input.suggestedCardType,
			status: 'offered',
		})
	}

	return { momentId: input.momentId, offerShare }
}
```
