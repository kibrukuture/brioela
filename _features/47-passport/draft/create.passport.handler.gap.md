# Draft: create.passport.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/passport/create.passport.handler.ts`

**Gap (feature 47):** Persist Passport after `preview_confirmed` consent.

**Source:** `build-guide/28-passport/02-passport-data-model.md`, `03-generation-flow.md`

---

```typescript
import { randomUUID } from 'node:crypto'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { passports } from '@/agents/brain/_schemas/passport.schema'
import { passportInstructionBlocks } from '@/agents/brain/_schemas/passport.instruction.block.schema'
import { passportAuditEvents } from '@/agents/brain/_schemas/passport.audit.event.schema'
import type { PassportCreateRequest } from '@brioela/shared/validator/passport/passport.schema'
import { computePassportExpiration } from '@/agents/brain/_helpers/passport/compute.passport.expiration.helper'
import { checkPassportMedicalBoundary } from '@/agents/brain/_helpers/passport/check.passport.medical.boundary.helper'

export async function createPassportHandler(
	agent: BrioelaBrain,
	userId: string,
	body: PassportCreateRequest,
): Promise<{ passportId: string; linkToken: string | null }> {
	if (body.consentLevel === 'preview_confirmed' || body.consentLevel === 'translated_preview_confirmed') {
		// ok
	} else if (body.consentLevel !== 'include_sensitive_detail') {
		throw new Error('Invalid consent level')
	}

	const boundary = checkPassportMedicalBoundary(body.instructionBlocks)
	if (!boundary.allowed) {
		throw new Error('Passport blocked by medical boundary')
	}

	const database = agent.database
	const passportId = randomUUID()
	const now = Date.now()
	const expiresAt = body.expiresAt ?? computePassportExpiration(body.kind)
	const linkToken = body.shareMode === 'qr_link' ? randomUUID().replace(/-/g, '') : null

	await database.insert(passports).values({
		id: passportId,
		userId,
		kind: body.kind,
		audience: body.audience,
		title: body.title,
		language: body.language,
		shareMode: body.shareMode,
		sensitivity: 'public_safe',
		status: 'active',
		consentLevel: body.consentLevel,
		linkToken,
		expiresAt,
		revokedAt: null,
		createdAt: now,
	})

	for (const [index, block] of body.instructionBlocks.entries()) {
		await database.insert(passportInstructionBlocks).values({
			id: randomUUID(),
			passportId,
			sortOrder: index,
			heading: block.heading,
			linesJson: JSON.stringify(block.lines),
			severity: block.severity,
		})
	}

	await database.insert(passportAuditEvents).values({
		id: randomUUID(),
		passportId,
		eventType: 'created',
		createdAt: now,
		metadataJson: JSON.stringify({ shareMode: body.shareMode }),
	})

	return { passportId, linkToken }
}
```
