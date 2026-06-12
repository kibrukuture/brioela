# Draft: set.food.audience.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/mesa/set.food.audience.handler.ts`

**Gap:** No persistence path for `set_food_audience` tool.

**Source:** `build-guide/26-mesa/03-mesa-tools.md`, `04-food-audience.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaFoodAudience } from '@/agents/brain/_schemas/mesa.food.audience.schema'
import type { FoodAudience } from '@shared/validator/mesa/food.audience.schema'
import { foodAudienceSchema } from '@shared/validator/mesa/food.audience.schema'
import { randomUUID } from 'node:crypto'

export async function setFoodAudience(
	db: BrainDatabase,
	input: FoodAudience,
): Promise<{ audienceId: string }> {
	const parsed = foodAudienceSchema.parse(input)
	const audienceId = randomUUID()
	const now = Date.now()

	await db.insert(mesaFoodAudience).values({
		id: audienceId,
		mesaId: parsed.mesaId,
		mode: parsed.mode,
		memberIdsJson: JSON.stringify(parsed.memberIds),
		source: parsed.source,
		expiresAt: parsed.expiresAt,
		createdAt: now,
	})

	return { audienceId }
}
```
