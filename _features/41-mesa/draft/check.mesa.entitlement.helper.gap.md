# Draft: check.mesa.entitlement.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/mesa/check.mesa.entitlement.helper.ts`

**Gap:** No Mesa tier gate or 8-member cap enforcement.

**Source:** `build-guide/26-mesa/10-tiering-and-rollout.md`, `build-guide/25-pricing-tiers/02-tier-entitlements.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaMember } from '@/agents/brain/_schemas/mesa.member.schema'
import { mesa } from '@/agents/brain/_schemas/mesa.schema'
import { and, eq, count } from 'drizzle-orm'

const MESA_ACTIVE_MEMBER_LIMIT = 8

export class MesaEntitlementError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'MesaEntitlementError'
	}
}

export async function checkMesaEntitlement(
	db: BrainDatabase,
	userId: string,
): Promise<{ entitled: true }> {
	// TODO(**43**): read subscription — Viva includes Mesa OR +$8/mo add-on
	const hasMesaEntitlement = false
	if (!hasMesaEntitlement) {
		throw new MesaEntitlementError('Mesa requires upgrade')
	}
	return { entitled: true }
}

export async function assertActiveMemberCap(
	db: BrainDatabase,
	mesaId: string,
): Promise<void> {
	const result = await db
		.select({ activeCount: count() })
		.from(mesaMember)
		.where(and(eq(mesaMember.mesaId, mesaId), eq(mesaMember.status, 'active')))
		.get()

	if ((result?.activeCount ?? 0) >= MESA_ACTIVE_MEMBER_LIMIT) {
		throw new MesaEntitlementError('Mesa supports up to 8 active members')
	}
}
```
