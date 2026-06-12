# Draft: apply.durable.sqlite.migration.helper

Target: `backend/src/database/sqlite/_migrations/apply.durable.sqlite.migration.helper.ts`

```
import { migrate } from 'drizzle-orm/durable-sqlite/migrator'

// Drizzle's Durable Object migrator accepts a driver-private database type. Derive
// the parameter from `migrate` itself so Bun/VS Code cannot split that private type
// across two physical Drizzle package instances.
// Evidence: https://orm.drizzle.team/docs/connect-cloudflare-do
// Evidence: https://orm.drizzle.team/docs/get-started/do-new#step-7---applying-changes-to-the-database

interface DurableSqliteMigrationBundle {
	journal: {
		entries: {
			idx: number
			when: number
			tag: string
			breakpoints: boolean
		}[]
	}
	migrations: Record<string, string>
}

type DurableSqliteMigrationDatabase = Parameters<typeof migrate>[0]

export async function applyDurableSqliteMigration(
	db: DurableSqliteMigrationDatabase,
	bundle: DurableSqliteMigrationBundle,
): Promise<void> {
	await migrate(db, bundle)
}
```
