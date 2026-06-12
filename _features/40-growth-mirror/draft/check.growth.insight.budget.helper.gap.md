# Draft: check.growth.insight.budget.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/growth-mirror/check.growth.insight.budget.helper.ts`

**Gap:** No enforcement of shared conversational-insight family budget + growth-specific two-week cap.

**Source:** `build-guide/40-growth-mirror/03-recognition-budget.md`, `brioela-specs/17-behavioral-food-pattern-detection.md`, `brioela-specs/53-growth-mirror.md`

**Note:** Spec **17** = max 1 insight/week family-wide. Spec **53** = max 1 growth recognition/2 weeks. Both apply.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { agentState } from '@/agents/brain/_schemas/agent.state.schema'
import { eq } from 'drizzle-orm'
import { growthRecognition } from '@/agents/brain/_schemas/growth.recognition.schema'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

export type GrowthBudgetCheckResult =
	| { allowed: true }
	| { allowed: false; reason: 'weekly_family_budget_exhausted' | 'growth_two_week_cap' }

export async function checkGrowthInsightBudget(
	db: BrainDatabase,
	userId: string,
	now: number = Date.now(),
): Promise<GrowthBudgetCheckResult> {
	const familyKey = 'insight_family.last_volunteered_at'
	const familyRow = await db
		.select()
		.from(agentState)
		.where(eq(agentState.key, familyKey))
		.get()

	if (familyRow?.value) {
		const lastFamily = Number(familyRow.value)
		if (now - lastFamily < ONE_WEEK_MS) {
			return { allowed: false, reason: 'weekly_family_budget_exhausted' }
		}
	}

	const lastGrowth = await db
		.select()
		.from(growthRecognition)
		.where(eq(growthRecognition.userId, userId))
		.orderBy(growthRecognition.surfacedAt)
		.get()

	if (lastGrowth?.surfacedAt && now - lastGrowth.surfacedAt < TWO_WEEKS_MS) {
		return { allowed: false, reason: 'growth_two_week_cap' }
	}

	return { allowed: true }
}
```
