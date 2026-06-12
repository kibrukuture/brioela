# Draft: create.mesa.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/mesa/create.mesa.handler.ts`

**Gap:** No Mesa creation with owner self-member bootstrap.

**Source:** `build-guide/26-mesa/02-conversational-setup.md`, `03-mesa-tools.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesa } from '@/agents/brain/_schemas/mesa.schema'
import { mesaMember } from '@/agents/brain/_schemas/mesa.member.schema'
import { checkMesaEntitlement } from '@/agents/brain/_helpers/mesa/check.mesa.entitlement.helper'
import { randomUUID } from 'node:crypto'

export async function createMesa(
	db: BrainDatabase,
	ownerUserId: string,
	displayName: string | null,
): Promise<{ mesaId: string; ownerMemberId: string }> {
	await checkMesaEntitlement(db, ownerUserId)

	const mesaId = randomUUID()
	const ownerMemberId = randomUUID()
	const now = Date.now()

	await db.insert(mesa).values({
		id: mesaId,
		ownerUserId,
		displayName,
		status: 'active',
		createdAt: now,
		updatedAt: now,
	})

	await db.insert(mesaMember).values({
		id: ownerMemberId,
		mesaId,
		label: 'me',
		role: 'self',
		ageBand: 'adult',
		status: 'active',
		createdAt: now,
		updatedAt: now,
	})

	return { mesaId, ownerMemberId }
}
```
