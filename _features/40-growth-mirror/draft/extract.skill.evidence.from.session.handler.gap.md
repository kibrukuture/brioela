# Draft: extract.skill.evidence.from.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/growth-mirror/extract.skill.evidence.from.session.handler.ts`

**Gap:** Post-session workflow has no skill-evidence extraction target.

**Source:** `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`, `build-guide/08-cooking-session/06-session-end-and-recipe.md`

**Called from:** **29** `runSessionEndProcessing` after outcome_summary.

---

```typescript
import { createId } from '@/lib/create-id'
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { memoryEvent } from '@/agents/brain/_schemas/memory.event.schema'
import {
	MEMORY_EVENT_KIND_SKILL_EVIDENCE,
	skillEvidencePayloadSchema,
} from '@brioela/shared/validator/growth-mirror/skill.evidence.payload.schema'
import { loadSessionEvidenceInputs } from '@/agents/brain/_helpers/growth-mirror/load.session.evidence.inputs.helper'
import { buildSkillEvidencePrompt } from '@/agents/brain/_helpers/growth-mirror/build.skill.evidence.prompt.helper'
import { parseSkillEvidenceResponse } from '@/agents/brain/_helpers/growth-mirror/parse.skill.evidence.response.helper'
import { filterOwnerAttributedSignals } from '@/agents/brain/_helpers/growth-mirror/filter.owner.attributed.signals.helper'
import { generateText } from 'ai'

export type ExtractSkillEvidenceInput = {
	userId: string
	sessionId: string
	endedAt: number
}

export type ExtractSkillEvidenceResult = {
	written: number
	skipped: number
}

export async function extractSkillEvidenceFromSession(
	db: BrainDatabase,
	env: Env,
	input: ExtractSkillEvidenceInput,
): Promise<ExtractSkillEvidenceResult> {
	const evidenceInputs = await loadSessionEvidenceInputs(db, input.sessionId)
	if (evidenceInputs.turnCount < 3) {
		return { written: 0, skipped: 0 }
	}

	const prompt = buildSkillEvidencePrompt(evidenceInputs)
	const { text } = await generateText({
		model: env.BRAIN_STRUCTURED_MODEL,
		prompt,
	})

	const proposals = parseSkillEvidenceResponse(text)
	const ownerFiltered = filterOwnerAttributedSignals(proposals, evidenceInputs)

	let written = 0
	let skipped = 0
	const now = Date.now()

	for (const proposal of ownerFiltered) {
		const parsed = skillEvidencePayloadSchema.safeParse(proposal)
		if (!parsed.success) {
			skipped += 1
			continue
		}

		await db.insert(memoryEvent).values({
			id: createId(),
			userId: input.userId,
			kind: MEMORY_EVENT_KIND_SKILL_EVIDENCE,
			payloadJson: JSON.stringify(parsed.data),
			capturedAt: input.endedAt,
			ingestedAt: now,
			source: 'post_session_extraction',
			sessionId: input.sessionId,
			entityKind: 'skill_dimension',
			entityId: parsed.data.dimension,
		})
		written += 1
	}

	return { written, skipped }
}
```
