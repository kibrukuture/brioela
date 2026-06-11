# Draft: write.user.memory.schema.ts

Target: `backend/src/agents/brain/_tools/_schemas/write.user.memory.schema.ts`

```typescript
import { z } from '@brioela/shared/zod'
import { jsonValueSchema } from '@brioela/shared/zod'

export const writeUserMemorySchema = z.object({
	namespace: z.string()
		.regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/, 'namespace must be dot-separated lowercase, max 3 levels')
		.describe('dot-separated namespace: e.g. health.medications or cooking.preferences'),
	key: z.string()
		.regex(/^[a-z][a-z0-9_]*$/, 'key must be lowercase with underscores only')
		.describe('the fact key within this namespace'),
	value: z.record(z.string(), jsonValueSchema).describe('the fact value to store — always a JSON object'),
	confidence: z.number().min(0).max(1).describe('0.0–1.0 confidence in this fact'),
	source: z.enum(['observed', 'stated', 'inferred']).describe('how this fact was determined'),
})
```

> **Gap G1:** Spec requires optional `importance` (1–10) on input. Not in current schema.
