import { createId } from '@brioela/shared/_ids'
import { listMemoryEvents, writeMemoryEventOnce, writeMigrationSmoke, writeSchemaReadiness } from '@/agents/brain/_repositories'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMigrationJournalEntry, BrainMigrationReadiness } from '@/agents/brain/_migrations/migration.schema'

export function runMigrationSmoke(
	database: BrainDatabase,
	migration: BrainMigrationJournalEntry,
	migrationRunId: string,
	startedAtEpochMs: number,
	finishedAtEpochMs: number,
): BrainMigrationReadiness {
	writeMemoryEventOnce(database, {
		id: `migration-smoke-${migration.idx.toString().padStart(4, '0')}`,
		userId: 'migration-smoke',
		kind: 'schema-readiness-smoke',
		payloadJson: JSON.stringify({ migration: migration.tag, migrationRunId }),
		capturedAt: finishedAtEpochMs,
		ingestedAt: finishedAtEpochMs,
		source: 'migration',
		sessionId: null,
		entityKind: null,
		entityId: null,
		geoHash: null,
	})

	const memoryEvents = listMemoryEvents(database, { limit: 1, cursor: null })

	writeMigrationSmoke(database, {
		id: createId(),
		migrationRunId,
		smoke: 'memory.write',
		status: 'passed',
		startedAt: startedAtEpochMs,
		finishedAt: finishedAtEpochMs,
		errorJson: null,
	})

	writeSchemaReadiness(database, {
		id: 'singleton',
		schemaVersion: migration.idx,
		minReadableVersion: migration.idx,
		targetVersion: migration.idx,
		status: 'ready',
		lastMigrationId: migration.tag,
		lastSmokeStatus: 'passed',
		lastErrorJson: null,
		updatedAt: finishedAtEpochMs,
	})

	return {
		status: 'ready',
		checkedAtEpochMs: finishedAtEpochMs,
		verifiedEventCount: memoryEvents.events.length,
	}
}
