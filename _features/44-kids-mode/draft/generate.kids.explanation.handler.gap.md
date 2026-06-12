# Draft: generate.kids.explanation.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/kids.mode/generate.kids.explanation.handler.ts`

**Gap:** No orchestration handler for explain flow.

**Source:** `build-guide/21-kids-mode/02-scan-explanation.md`, `05-safety-and-tier-boundary.md`

---

```typescript
import { generateKidsExplanationInputSchema } from '@/shared/validator/kids.mode/kids.scan.explanation.schema'
import { checkKidsModeEntitlement } from '@/agents/brain/_helpers/kids.mode/check.kids.mode.entitlement.helper'
import { loadKidsModeProfile } from '@/agents/brain/_helpers/kids.mode/load.kids.mode.profile.helper'
import { generateKidsScanExplanation } from '@/agents/brain/_helpers/kids.mode/generate.kids.scan.explanation.helper'
import { appendKidsScanEvent } from '@/agents/brain/_helpers/kids.mode/append.kids.scan.event.helper'
import { loadScanSnapshotForKidsExplanation } from '@/agents/brain/_helpers/kids.mode/load.scan.snapshot.for.kids.explanation.helper'

type GenerateKidsExplanationHandlerInput = {
	userId: string
	body: unknown
}

export async function generateKidsExplanationHandler(input: GenerateKidsExplanationHandlerInput) {
	const parsed = generateKidsExplanationInputSchema.parse(input.body)

	const entitlement = await checkKidsModeEntitlement(input.userId)
	if (!entitlement.allowed) {
		return {
			status: 402 as const,
			body: {
				error: 'kids_mode_requires_upgrade',
				upgradeTarget: entitlement.upgradeTarget,
			},
		}
	}

	const profile = await loadKidsModeProfile(input.userId)
	const ageRange = parsed.ageRange ?? profile.ageRange

	const snapshot = await loadScanSnapshotForKidsExplanation({
		userId: input.userId,
		scanEventId: parsed.scanEventId,
	})

	const explanation = await generateKidsScanExplanation({ ageRange, snapshot })

	await appendKidsScanEvent({
		userId: input.userId,
		explanation,
	})

	return { status: 200 as const, body: explanation }
}
```
