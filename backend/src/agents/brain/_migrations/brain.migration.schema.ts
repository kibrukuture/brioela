export interface BrainMigrationJournalEntry {
	idx: number
	when: number
	tag: string
	breakpoints: boolean
}

export interface BrainMigrationJournal {
	entries: BrainMigrationJournalEntry[]
}

export interface BrainMigrationBundle {
	journal: BrainMigrationJournal
	migrations: Record<string, string>
}

export interface BrainMigrationReadiness {
	status: 'ready'
	checkedAtEpochMs: number
	verifiedEventCount: number
}
