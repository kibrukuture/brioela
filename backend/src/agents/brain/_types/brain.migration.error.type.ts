export class EmptyBrainMigrationJournalError extends Error {
	constructor() {
		super('Brain migration journal has no entries.')
		this.name = 'EmptyBrainMigrationJournalError'
	}
}

export class BrainMigrationLockedError extends Error {
	constructor() {
		super('Brain migration lock is held by another run.')
		this.name = 'BrainMigrationLockedError'
	}
}
