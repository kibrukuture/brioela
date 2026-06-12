# Draft: load.session.context.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_schemas/load.session.context.schema.ts`

**Gap (feature 16):** Zod schema for `load_session_context` per `implementable-specs/brioela-tools/16-load-session-context.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { z } from '@brioela/shared/zod'

export const loadSessionContextSchema = z.object({
	current_session_id: z.uuid().describe('The session row just created for this session. Excluded from prior-session queries.'),
	limit_recent_sessions: z
		.number()
		.int()
		.min(1)
		.max(5)
		.default(3)
		.describe('How many recent completed sessions to include outcome summaries for. Default 3. Max 5.'),
})

export type LoadSessionContextParams = z.infer<typeof loadSessionContextSchema>
```

Add to `_tools/_schemas/index.ts`:

```typescript
export * from './load.session.context.schema'
```
