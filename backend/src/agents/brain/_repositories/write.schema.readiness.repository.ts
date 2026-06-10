import { brainSchemaReadiness, type NewBrainSchemaReadiness } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeSchemaReadiness(db: BrainDatabase, readiness: NewBrainSchemaReadiness): void {
	db
		.insert(brainSchemaReadiness)
		.values(readiness)
		.onConflictDoUpdate({
			target: brainSchemaReadiness.id,
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
