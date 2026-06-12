# Draft: search.web.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_schemas/search.web.schema.ts`

**Gap (feature 18):** Zod input per `implementable-specs/brioela-tools/18-search-web.md` lines 30–59.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { z } from '@brioela/shared/zod'

export const searchWebSchema = z.object({
	query: z
		.string()
		.min(3, 'Query too short — minimum 3 characters')
		.max(300, 'Query too long — maximum 300 characters'),
	search_type: z.enum(['factual', 'research']).default('factual'),
	max_results: z.number().int().min(1).max(10).default(5),
	include_full_content: z.boolean().default(false),
})

export type SearchWebParams = z.infer<typeof searchWebSchema>
export type SearchWebSearchType = SearchWebParams['search_type']
```

Add to `_tools/_schemas/index.ts`:

```typescript
export * from './search.web.schema'
```
