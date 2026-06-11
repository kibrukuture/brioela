# Draft: brain.migration.manifest.error.type.ts

Target: `tools/brioela-brain-migration-manifest/_types/brain.migration.manifest.error.type.ts`

```ts
export class InvalidBrainMigrationJournalError extends Error {
	constructor() {
		super('Brain migration journal is invalid.')
		this.name = 'InvalidBrainMigrationJournalError'
	}
}

export class StaleBrainMigrationManifestError extends Error {
	constructor(manifestPath: string) {
		super(`${manifestPath} is stale or hand-edited. Run bun run brain:db:manifest:generate.`)
		this.name = 'StaleBrainMigrationManifestError'
	}
}
```
