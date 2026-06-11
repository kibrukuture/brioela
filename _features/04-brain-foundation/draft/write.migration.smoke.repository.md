# Draft: write.migration.smoke.repository.ts

Target: `backend/src/agents/brain/_repositories/write.migration.smoke.repository.ts`

```ts
import { migrationSmokeResults, type BrainMigrationSmoke, type NewBrainMigrationSmoke } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { getReturned } from '@/database/drizzle/_database'

export function writeMigrationSmoke(database: BrainDatabase, migrationSmoke: NewBrainMigrationSmoke): BrainMigrationSmoke {
	return getReturned(database.insert(migrationSmokeResults).values(migrationSmoke).returning())
}
```
