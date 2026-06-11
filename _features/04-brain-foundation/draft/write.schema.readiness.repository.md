# Draft: write.schema.readiness.repository.ts

Target: `backend/src/agents/brain/_repositories/write.schema.readiness.repository.ts`

```ts
import { schemaReadiness, type NewBrainSchemaReadiness } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeSchemaReadiness(db: BrainDatabase, readiness: NewBrainSchemaReadiness): void {
	db
		.insert(schemaReadiness)
		.values(readiness)
		.onConflictDoUpdate({
			target: schemaReadiness.id,
			set: {
				schemaVersion: readiness.schemaVersion,
				minReadableVersion: readiness.minReadableVersion,
				targetVersion: readiness.targetVersion,
				status: readiness.status,
				lastMigrationId: readiness.lastMigrationId,
				lastSmokeStatus: readiness.lastSmokeStatus,
				lastErrorJson: readiness.lastErrorJson,
				updatedAt: readiness.updatedAt,
			},
		})
		.run()
}
```
