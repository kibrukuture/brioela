# Draft: push.heirloom.item.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/heirloom/push.heirloom.item.handler.ts`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/database'
import {
	pushHeirloomDeltaHelper,
	type PushHeirloomItemInput,
} from '@/agents/brain/_helpers/heirloom/push.heirloom.delta.helper'

export async function pushHeirloomItemHandler(
	db: BrainDatabase,
	env: Cloudflare.Env,
	userId: string,
	heirloomId: string,
	input: Omit<PushHeirloomItemInput, 'heirloomId'>,
): Promise<{ version: number; recipientPromptCount: number }> {
	const { version } = await pushHeirloomDeltaHelper(db, userId, { heirloomId, ...input })

	const recipientPromptCount = await notifyPriorRecipientsOfDelta(env, heirloomId, version)

	return { version, recipientPromptCount }
}

async function notifyPriorRecipientsOfDelta(
	_env: Cloudflare.Env,
	_heirloomId: string,
	_version: number,
): Promise<number> {
	return 0
}
```
