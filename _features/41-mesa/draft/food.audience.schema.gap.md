# Draft: food.audience.schema.ts (gap — file does not exist)

Target: `shared/validator/mesa/food.audience.schema.ts`

**Gap:** No shared Zod contract for cross-feature Food Audience primitive.

**Source:** `build-guide/26-mesa/04-food-audience.md`, `brioela-specs/41-mesa.md` § Food Audience

---

```typescript
import { z } from 'zod'

export const foodAudienceModeSchema = z.enum([
	'just_me',
	'mesa',
	'selected_members',
	'guest_session',
])

export const foodAudienceSourceSchema = z.enum(['explicit', 'inferred', 'session_default'])

export const foodAudienceSchema = z.object({
	mode: foodAudienceModeSchema,
	mesaId: z.string().nullable(),
	memberIds: z.array(z.string()),
	source: foodAudienceSourceSchema,
	expiresAt: z.number().int().nonnegative().nullable(),
})

export type FoodAudience = z.infer<typeof foodAudienceSchema>
```
