# Draft: preview.passport.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/passport/preview.passport.handler.ts`

**Gap (feature 47):** Build draft blocks without persist — required before share.

**Source:** `build-guide/28-passport/03-generation-flow.md`

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { PassportPreviewRequest } from '@brioela/shared/validator/passport/passport.schema'
import { buildPassportBlocks } from '@/agents/brain/_helpers/passport/build.passport.blocks.helper'
import { computePassportExpiration } from '@/agents/brain/_helpers/passport/compute.passport.expiration.helper'

export async function previewPassportHandler(
	agent: BrioelaBrain,
	userId: string,
	body: PassportPreviewRequest,
): Promise<{
	instructionBlocks: Awaited<ReturnType<typeof buildPassportBlocks>>['blocks']
	sensitivity: Awaited<ReturnType<typeof buildPassportBlocks>>['sensitivity']
	redactions: Awaited<ReturnType<typeof buildPassportBlocks>>['redactions']
	suggestedExpiresAt: number
}> {
	const database = agent.database

	const built = await buildPassportBlocks(database, {
		userId,
		kind: body.kind,
		audience: body.audience,
		sourceContext: body.sourceContext,
	})

	const suggestedExpiresAt = computePassportExpiration(body.kind)

	return {
		instructionBlocks: built.blocks,
		sensitivity: built.sensitivity,
		redactions: built.redactions,
		suggestedExpiresAt,
	}
}
```
