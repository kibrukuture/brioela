# Draft: merge.constraints.for.audience.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/mesa/merge.constraints.for.audience.helper.ts`

**Gap:** No merge of personal + mesa + guest constraint layers for filtering.

**Source:** `build-guide/26-mesa/01-mesa-data-model.md`, `04-food-audience.md`, spec **37** guest layering

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { constraints } from '@/agents/brain/_schemas/constraint.schema'
import { mesaConstraint } from '@/agents/brain/_schemas/mesa.constraint.schema'
import type { FoodAudience } from '@shared/validator/mesa/food.audience.schema'
import { and, eq, inArray } from 'drizzle-orm'

export type MergedConstraint = {
	scope: 'personal' | 'mesa_member'
	memberId: string | null
	constraintType: string
	entityKind: string
	entityValue: string
	severity: 'hard' | 'soft'
}

export async function mergeConstraintsForAudience(
	db: BrainDatabase,
	userId: string,
	audience: FoodAudience,
	memberIds: string[],
): Promise<MergedConstraint[]> {
	const merged: MergedConstraint[] = []

	if (audience.mode === 'just_me' || audience.mode === 'guest_session') {
		const personal = await db
			.select()
			.from(constraints)
			.where(and(eq(constraints.userId, userId), eq(constraints.status, 'confirmed')))
			.all()
		for (const row of personal) {
			merged.push({
				scope: 'personal',
				memberId: null,
				constraintType: row.constraintType,
				entityKind: row.entityKind,
				entityValue: row.entityValue,
				severity: row.constraintType === 'hard_allergy' ? 'hard' : 'soft',
			})
		}
	}

	if (memberIds.length > 0) {
		const mesaRows = await db
			.select()
			.from(mesaConstraint)
			.where(
				and(
					inArray(mesaConstraint.memberId, memberIds),
					eq(mesaConstraint.active, true),
					eq(mesaConstraint.confirmedByOwner, true),
				),
			)
			.all()
		for (const row of mesaRows) {
			merged.push({
				scope: 'mesa_member',
				memberId: row.memberId,
				constraintType: row.constraintType,
				entityKind: row.entityKind,
				entityValue: row.entityValue,
				severity: row.severity,
			})
		}
	}

	return merged
}
```
