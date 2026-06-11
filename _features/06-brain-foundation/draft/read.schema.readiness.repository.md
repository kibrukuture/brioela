# Draft: read.schema.readiness.repository.ts

Target: `backend/src/agents/brain/_repositories/read.schema.readiness.repository.ts`

```ts
import { schemaReadiness, type BrainSchemaReadiness } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { eq, getOne } from '@/database/drizzle/_database'

export function readSchemaReadiness(database: BrainDatabase): BrainSchemaReadiness | null {
	return getOne(database.select().from(schemaReadiness).where(eq(schemaReadiness.id, 'singleton')))
}
```
