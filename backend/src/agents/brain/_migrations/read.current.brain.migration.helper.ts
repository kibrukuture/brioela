import type { BrainMigrationJournal, BrainMigrationJournalEntry } from '@/agents/brain/_migrations/brain.migration.schema'
import { EmptyBrainMigrationJournalError } from '@/agents/brain/_types'

export function readCurrentBrainMigration(journal: BrainMigrationJournal): BrainMigrationJournalEntry {
	let currentMigration: BrainMigrationJournalEntry | null = null

	for (const migration of journal.entries) {
		if (currentMigration === null || migration.idx > currentMigration.idx) {
			currentMigration = migration
		}
	}

	if (currentMigration === null) {
		throw new EmptyBrainMigrationJournalError()
	}

	return currentMigration
}
