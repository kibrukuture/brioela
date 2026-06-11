# Draft: write.migration.run.repository.ts

Target: `backend/src/agents/brain/_repositories/write.migration.run.repository.ts`

```ts
import { migrationRuns, type BrainMigrationRun, type NewBrainMigrationRun } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { eq, getReturned } from '@/database/drizzle/_database'

export function writeMigrationRun(database: BrainDatabase, migrationRun: NewBrainMigrationRun): BrainMigrationRun {
	return getReturned(database.insert(migrationRuns).values(migrationRun).returning())
}

export function writeMigrationRunStatus(
	database: BrainDatabase,
	migrationRun: Pick<BrainMigrationRun, 'id' | 'status' | 'finishedAt' | 'errorJson'>,
): BrainMigrationRun {
	return getReturned(
		database
			.update(migrationRuns)
			.set({
				status: migrationRun.status,
				finishedAt: migrationRun.finishedAt,
				errorJson: migrationRun.errorJson,
			})
			.where(eq(migrationRuns.id, migrationRun.id))
			.returning(),
	)
}
```
