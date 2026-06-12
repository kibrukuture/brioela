# Draft: create.heirloom.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/heirloom/create.heirloom.handler.ts`

---

```typescript
import type { HeirloomAssembleInput } from '@brioela/shared/validator/heirloom/heirloom.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { assembleHeirloomHelper } from '@/agents/brain/_helpers/heirloom/assemble.heirloom.helper'

export async function createHeirloomHandler(
	db: BrainDatabase,
	userId: string,
	input: HeirloomAssembleInput,
): Promise<{ heirloomId: string; version: number }> {
	return assembleHeirloomHelper(db, userId, input)
}
```
