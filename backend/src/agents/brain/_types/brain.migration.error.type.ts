export class EmptyBrainMigrationJournalError extends Error {
	constructor() {
		super('Brain migration journal has no entries.')
		this.name = 'EmptyBrainMigrationJournalError'
	}
}
