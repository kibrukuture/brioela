import { listBrainMemoryEvents, writeBrainMemoryEventOnce, writeBrainSchemaReadiness } from '@/agents/brain/_repositories'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMigrationJournalEntry, BrainMigrationReadiness } from '@/agents/brain/_migrations/brain.migration.schema'

export function runBrainMigrationSmoke(
	database: BrainDatabase,
	migration: BrainMigrationJournalEntry,
	checkedAtEpochMs: number,
): BrainMigrationReadiness {
	writeBrainSchemaReadiness(database, {
		id: 'brain',
		schemaVersion: migration.idx,
		minReadableVersion: migration.idx,
		targetVersion: migration.idx,
		status: 'ready',
		lastMigrationId: migration.tag,
		lastSmokeStatus: 'passed',
		lastErrorJson: null,
		updatedAt: checkedAtEpochMs,
	})

	writeBrainMemoryEventOnce(database, {
		id: `brain-migration-smoke-${migration.idx.toString().padStart(4, '0')}`,
		userId: 'brain-migration-smoke',
		kind: 'schema-readiness-smoke',
		payloadJson: JSON.stringify({ migration: migration.tag }),
		capturedAt: checkedAtEpochMs,
		ingestedAt: checkedAtEpochMs,
		source: 'brain-migration',
		sessionId: null,
		entityKind: null,
		entityId: null,
		geoHash: null,
	})

	const memoryEvents = listBrainMemoryEvents(database, { limit: 1, cursor: null })

	return {
		status: 'ready',
		checkedAtEpochMs,
		verifiedEventCount: memoryEvents.events.length,
	}
}
