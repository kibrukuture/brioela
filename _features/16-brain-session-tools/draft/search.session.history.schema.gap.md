# Draft: search.session.history.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_schemas/search.session.history.schema.ts`

**Gap (feature 16):** Zod schema per `implementable-specs/brioela-tools/17-search-session-history.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { z } from '@brioela/shared/zod'

const sessionTypeFilter = z.enum(['chat', 'cooking', 'alarm', 'background'])

export const searchSessionHistorySchema = z.object({
	query: z
		.string()
		.min(1)
		.max(500)
		.describe('Search query matched against outcome_summary via FTS5 MATCH. Phrase search: use double quotes.'),
	session_type: sessionTypeFilter.optional().describe('Filter by session type. Omit to search all types.'),
	limit: z
		.number()
		.int()
		.min(1)
		.max(10)
		.default(5)
		.describe('Max results. Default 5. Never exceed 10.'),
	since_timestamp: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Unix timestamp ms. Only sessions ended after this time.'),
})

export type SearchSessionHistoryParams = z.infer<typeof searchSessionHistorySchema>
```

Add to `_tools/_schemas/index.ts`:

```typescript
export * from './search.session.history.schema'
```
