import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const smokeStatus = ['passed', 'failed'] as const

export const brainMigrationSmokeResults = sqliteTable(
	'brain_migration_smoke_results',
	{
		id: text('id').primaryKey(),
		migrationRunId: text('migration_run_id').notNull(),
		smoke: text('smoke').notNull(),
		status: text('status', { enum: smokeStatus }).notNull(),
		startedAt: integer('started_at', { mode: 'number' }).notNull(),
		finishedAt: integer('finished_at', { mode: 'number' }),
		errorJson: text('error_json'),
	},
	(table) => [
		check('brain_migration_smoke_results_status_check', sql`${table.status} in ('passed', 'failed')`),
		check('brain_migration_smoke_results_started_at_check', sql`${table.startedAt} >= 0`),
		check('brain_migration_smoke_results_finished_at_check', sql`${table.finishedAt} is null or ${table.finishedAt} >= ${table.startedAt}`),
		check('brain_migration_smoke_results_error_json_check', sql`${table.errorJson} is null or json_valid(${table.errorJson})`),
		index('brain_migration_smoke_results_migration_run_id_index').on(table.migrationRunId),
	],
)

export type BrainMigrationSmoke = typeof brainMigrationSmokeResults.$inferSelect
export type NewBrainMigrationSmoke = typeof brainMigrationSmokeResults.$inferInsert
