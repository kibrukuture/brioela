# Draft: evaluate.mesa.compatibility.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/mesa/evaluate.mesa.compatibility.helper.ts`

**Gap:** No per-member compatibility engine — core Mesa product logic.

**Source:** `build-guide/26-mesa/05-food-audience-compatibility-engine.md`

**Never:** Average away a hard red for one member.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaMember } from '@/agents/brain/_schemas/mesa.member.schema'
import type {
	FoodAudience,
	MesaCompatibilityResult,
} from '@shared/validator/mesa/mesa.compatibility.result.schema'
import { inArray } from 'drizzle-orm'
import { mergeConstraintsForAudience } from './merge.constraints.for.audience.helper'

export type CompatibilityEntity = {
	kind: MesaCompatibilityResult['entityKind']
	id: string
	ingredientTokens: string[]
	confidence: number
}

export async function evaluateMesaCompatibility(
	db: BrainDatabase,
	userId: string,
	audience: FoodAudience,
	entity: CompatibilityEntity,
	memberIds: string[],
): Promise<MesaCompatibilityResult> {
	const members = await db
		.select()
		.from(mesaMember)
		.where(inArray(mesaMember.id, memberIds))
		.all()

	const constraints = await mergeConstraintsForAudience(db, userId, audience, memberIds)

	const memberResults = members.map((member) => {
		const memberConstraints = constraints.filter((c) => c.memberId === member.id)
		const hardHits = memberConstraints.filter(
			(c) =>
				c.severity === 'hard' &&
				entity.ingredientTokens.some((t) => t.includes(c.entityValue.toLowerCase())),
		)
		if (hardHits.length > 0) {
			return {
				memberId: member.id,
				label: member.label,
				verdict: 'red' as const,
				reason: `Contains ${hardHits[0]?.entityValue}`,
				matchedConstraints: hardHits.map((h) => h.entityValue),
				suggestedSubstitution: null,
			}
		}
		if (entity.confidence < 0.6 && memberConstraints.some((c) => c.severity === 'hard')) {
			return {
				memberId: member.id,
				label: member.label,
				verdict: 'yellow' as const,
				reason: 'Label incomplete — cannot confirm safety',
				matchedConstraints: [],
				suggestedSubstitution: null,
			}
		}
		return {
			memberId: member.id,
			label: member.label,
			verdict: 'green' as const,
			reason: 'No conflicts found',
			matchedConstraints: [],
			suggestedSubstitution: null,
		}
	})

	const reds = memberResults.filter((r) => r.verdict === 'red').length
	const greens = memberResults.filter((r) => r.verdict === 'green').length
	const yellows = memberResults.filter((r) => r.verdict === 'yellow').length

	let overall: MesaCompatibilityResult['overall'] = 'works_for_all'
	if (reds >= 2) overall = 'avoid_for_mesa'
	else if (reds > 0 && greens > 0) overall = 'works_for_some'
	else if (yellows > 0 && reds === 0) overall = 'ask_or_modify'

	const summary =
		overall === 'works_for_all'
			? 'Works for everyone at your Mesa.'
			: overall === 'works_for_some'
				? `Works for some — avoid for ${memberResults.find((r) => r.verdict === 'red')?.label ?? 'a member'}.`
				: overall === 'ask_or_modify'
					? 'Could work with a small change — review details.'
					: 'Not a good Mesa choice — multiple hard conflicts.'

	return {
		entityKind: entity.kind,
		entityId: entity.id,
		audience,
		overall,
		memberResults,
		summary,
	}
}
```
