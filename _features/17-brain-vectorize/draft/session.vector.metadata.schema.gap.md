# Draft: session.vector.metadata.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/session.vector.metadata.schema.ts`

**Gap (feature 17):** Typed metadata stored on each session vector upsert.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { z } from '@brioela/shared/zod'

export const sessionVectorMetadataSchema = z.object({
	session_type: z.enum(['chat', 'cooking', 'alarm', 'background']),
	ended_at: z.number().int().positive(),
	recipe_id: z.string(), // UUID or empty string
})

export type SessionVectorMetadata = z.infer<typeof sessionVectorMetadataSchema>

export function buildSessionVectorMetadata(params: {
	sessionType: string
	endedAt: number
	recipeId: string | null
}): SessionVectorMetadata {
	return sessionVectorMetadataSchema.parse({
		session_type: params.sessionType,
		ended_at: params.endedAt,
		recipe_id: params.recipeId ?? '',
	})
}
```

Add to `_schemas/index.ts` export when created.

**Indexed in Vectorize:** `session_type`, `ended_at` only. `recipe_id` filtered post-query in repository.
