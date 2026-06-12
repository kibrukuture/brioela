# Draft: refine.encore.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/encore/refine.encore.handler.ts`

**Source:** `build-guide/31-encore/04-first-cook-refinement.md`

```typescript
import { eq } from 'drizzle-orm'
import { createId } from '@brioela/shared/id'
import type { BrainDatabase } from '@/agents/brain/database'
import { encores } from '@/agents/brain/_schemas/encore.schema'
import { encoreOpenQuestions } from '@/agents/brain/_schemas/encore.open.question.schema'
import { encoreRefinements } from '@/agents/brain/_schemas/encore.refinement.schema'
import { getEncoreHandler } from './get.encore.handler'

export type EncoreRefineInput = {
	sessionId: string
	resolutions: Array<{ questionId: string; resolutionNote: string }>
	verdict?: string
	fieldUpdates?: Array<{ fieldPath: string; newValue: string }>
}

export async function refineEncoreHandler(
	db: BrainDatabase,
	userId: string,
	encoreId: string,
	input: EncoreRefineInput,
) {
	const now = Date.now()

	const encore = await db.query.encores.findFirst({ where: eq(encores.id, encoreId) })
	if (!encore || encore.userId !== userId) throw new Error('Encore not found')

	for (const resolution of input.resolutions) {
		await db
			.update(encoreOpenQuestions)
			.set({
				resolved: true,
				resolutionNote: resolution.resolutionNote,
				resolvedInSessionId: input.sessionId,
			})
			.where(eq(encoreOpenQuestions.id, resolution.questionId))
	}

	for (const update of input.fieldUpdates ?? []) {
		await db.insert(encoreRefinements).values({
			id: createId(),
			encoreId,
			sessionId: input.sessionId,
			fieldChanged: update.fieldPath,
			oldValue: '',
			newValue: update.newValue,
			evidence: input.verdict ? 'user_verdict' : 'taste_check',
			createdAt: now,
		})
	}

	const unresolved = await db.query.encoreOpenQuestions.findMany({
		where: eq(encoreOpenQuestions.encoreId, encoreId),
	})

	const nextStatus =
		unresolved.every((q) => q.resolved) && !input.verdict?.includes('not quite')
			? 'stable'
			: 'refining'

	await db
		.update(encores)
		.set({ status: nextStatus, updatedAt: now })
		.where(eq(encores.id, encoreId))

	// TODO(08): apply fieldUpdates to recipes.content via update path

	return getEncoreHandler(db, userId, encoreId)
}
```
