# Draft: brain.migration.error.type.ts

Target: `backend/src/agents/brain/_types/brain.migration.error.type.ts`

```ts
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
```
