# Draft: load.active.food.audience.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/mesa/load.active.food.audience.helper.ts`

**Gap:** No loader for current Food Audience with expiry enforcement.

**Source:** `build-guide/26-mesa/04-food-audience.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaFoodAudience } from '@/agents/brain/_schemas/mesa.food.audience.schema'
import type { FoodAudience } from '@shared/validator/mesa/food.audience.schema'
import { desc, isNull, or, gt, sql } from 'drizzle-orm'

export async function loadActiveFoodAudience(
	db: BrainDatabase,
	nowMs: number,
): Promise<FoodAudience> {
	const row = await db
		.select()
		.from(mesaFoodAudience)
		.where(
			or(isNull(mesaFoodAudience.expiresAt), gt(mesaFoodAudience.expiresAt, nowMs)),
		)
		.orderBy(desc(mesaFoodAudience.createdAt))
		.get()

	if (!row) {
		return {
			mode: 'just_me',
			mesaId: null,
			memberIds: [],
			source: 'session_default',
			expiresAt: null,
		}
	}

	return {
		mode: row.mode,
		mesaId: row.mesaId,
		memberIds: JSON.parse(row.memberIdsJson) as string[],
		source: row.source,
		expiresAt: row.expiresAt ?? null,
	}
}
```
