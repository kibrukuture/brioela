# Draft: mesa.compatibility.result.schema.ts (gap — file does not exist)

Target: `shared/validator/mesa/mesa.compatibility.result.schema.ts`

**Gap:** No shared compatibility result shape for scan/menu/plan surfaces.

**Source:** `build-guide/26-mesa/05-food-audience-compatibility-engine.md`

---

```typescript
import { z } from 'zod'
import { foodAudienceSchema } from './food.audience.schema'

export const mesaMemberVerdictSchema = z.enum(['green', 'yellow', 'red'])

export const mesaOverallVerdictSchema = z.enum([
	'works_for_all',
	'works_for_some',
	'ask_or_modify',
	'avoid_for_mesa',
])

export const mesaMemberCompatibilitySchema = z.object({
	memberId: z.string(),
	label: z.string(),
	verdict: mesaMemberVerdictSchema,
	reason: z.string(),
	matchedConstraints: z.array(z.string()),
	suggestedSubstitution: z.string().nullable(),
})

export const mesaCompatibilityResultSchema = z.object({
	entityKind: z.enum(['product', 'recipe', 'menu_dish', 'meal_plan', 'grocery_item']),
	entityId: z.string(),
	audience: foodAudienceSchema,
	overall: mesaOverallVerdictSchema,
	memberResults: z.array(mesaMemberCompatibilitySchema),
	summary: z.string(),
})

export type MesaCompatibilityResult = z.infer<typeof mesaCompatibilityResultSchema>
```
