# Draft: revoke.passport.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/passport/revoke.passport.handler.ts`

**Gap (feature 47):** User revoke + link invalidation + audit event.

**Source:** `build-guide/28-passport/02-passport-data-model.md`

---

```typescript
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { passports } from '@/agents/brain/_schemas/passport.schema'
import { passportAuditEvents } from '@/agents/brain/_schemas/passport.audit.event.schema'

export async function revokePassportHandler(
	agent: BrioelaBrain,
	userId: string,
	passportId: string,
): Promise<{ revoked: boolean }> {
	const database = agent.database
	const now = Date.now()

	const rows = await database
		.select()
		.from(passports)
		.where(eq(passports.id, passportId))
		.limit(1)

	const row = rows[0]
	if (!row || row.userId !== userId || row.status === 'revoked') {
		return { revoked: false }
	}

	await database
		.update(passports)
		.set({ status: 'revoked', revokedAt: now })
		.where(eq(passports.id, passportId))

	await database.insert(passportAuditEvents).values({
		id: randomUUID(),
		passportId,
		eventType: 'revoked',
		createdAt: now,
		metadataJson: '{}',
	})

	return { revoked: true }
}
```
