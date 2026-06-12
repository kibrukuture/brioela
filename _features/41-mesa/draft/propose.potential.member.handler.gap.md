# Draft: propose.potential.member.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/mesa/propose.potential.member.handler.ts`

**Gap:** No inference candidate writer; **35** guest archive unwired.

**Source:** `build-guide/26-mesa/08-potential-members.md`

**Never:** Auto-create active `mesa_member` from inference.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaPotentialMember } from '@/agents/brain/_schemas/mesa.potential.member.schema'
import { randomUUID } from 'node:crypto'

export type PotentialMemberEvidence = {
	source: 'cooking' | 'scan' | 'meal_plan' | 'menu' | 'guest_session' | 'chat'
	summary: string
	capturedAt: number
}

export async function proposePotentialMember(
	db: BrainDatabase,
	mesaId: string,
	suggestedLabel: string,
	roleGuess: string | null,
	evidence: PotentialMemberEvidence[],
	confidence: number,
): Promise<{ candidateId: string } | null> {
	if (evidence.length < 3 && confidence < 0.75) {
		return null
	}

	const candidateId = randomUUID()
	const now = Date.now()

	await db.insert(mesaPotentialMember).values({
		id: candidateId,
		mesaId,
		suggestedLabel,
		roleGuess,
		evidenceJson: JSON.stringify(evidence),
		confidence,
		status: 'candidate',
		firstSeenAt: evidence[0]?.capturedAt ?? now,
		lastSeenAt: now,
	})

	return { candidateId }
}
```
