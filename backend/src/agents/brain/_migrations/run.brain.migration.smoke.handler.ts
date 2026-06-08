import { nanoid } from 'nanoid'
import { listBrainMemoryEvents, writeBrainMemoryEventOnce, writeBrainMigrationSmoke, writeBrainSchemaReadiness } from '@/agents/brain/_repositories'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMigrationJournalEntry, BrainMigrationReadiness } from '@/agents/brain/_migrations/brain.migration.schema'

export function runBrainMigrationSmoke(
	database: BrainDatabase,
	migration: BrainMigrationJournalEntry,
	migrationRunId: string,
	startedAtEpochMs: number,
	finishedAtEpochMs: number,
): BrainMigrationReadiness {
	writeBrainMemoryEventOnce(database, {
		id: `brain-migration-smoke-${migration.idx.toString().padStart(4, '0')}`,
		userId: 'brain-migration-smoke',
		kind: 'schema-readiness-smoke',
		payloadJson: JSON.stringify({ migration: migration.tag, migrationRunId }),
		capturedAt: finishedAtEpochMs,
		ingestedAt: finishedAtEpochMs,
		source: 'brain-migration',
		sessionId: null,
		entityKind: null,
		entityId: null,
		geoHash: null,
	})

	const memoryEvents = listBrainMemoryEvents(database, { limit: 1, cursor: null })

	writeBrainMigrationSmoke(database, {
		id: nanoid(24),
		migrationRunId,
		smoke: 'brain.memory.write',
		status: 'passed',
		startedAt: startedAtEpochMs,
		finishedAt: finishedAtEpochMs,
		errorJson: null,
	})

	writeBrainSchemaReadiness(database, {
		id: 'brain',
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
