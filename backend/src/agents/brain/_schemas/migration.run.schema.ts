import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const migrationPhase = ['expand', 'dual_write', 'backfill', 'verify', 'contract'] as const
const migrationRisk = ['low', 'medium', 'high', 'blocked'] as const
const migrationStatus = ['started', 'applied', 'smoke_passed', 'failed', 'blocked'] as const

export const migrationRuns = sqliteTable(
	'migration_runs',
	{
		id: text('id').primaryKey(),
		migrationId: text('migration_id').notNull(),
		fromVersion: integer('from_version', { mode: 'number' }).notNull(),
		toVersion: integer('to_version', { mode: 'number' }).notNull(),
		phase: text('phase', { enum: migrationPhase }).notNull(),
		risk: text('risk', { enum: migrationRisk }).notNull(),
		startedAt: integer('started_at', { mode: 'number' }).notNull(),
		finishedAt: integer('finished_at', { mode: 'number' }),
		status: text('status', { enum: migrationStatus }).notNull(),
		attempt: integer('attempt', { mode: 'number' }).notNull(),
		errorJson: text('error_json'),
		deploymentId: text('deployment_id').notNull(),
	},
	(table) => [
		check('migration_runs_phase_check', sql`${table.phase} in ('expand', 'dual_write', 'backfill', 'verify', 'contract')`),
		check('migration_runs_risk_check', sql`${table.risk} in ('low', 'medium', 'high', 'blocked')`),
		check('migration_runs_status_check', sql`${table.status} in ('started', 'applied', 'smoke_passed', 'failed', 'blocked')`),
		check('migration_runs_from_version_check', sql`${table.fromVersion} >= 0`),
		check('migration_runs_to_version_check', sql`${table.toVersion} >= ${table.fromVersion}`),
		check('migration_runs_started_at_check', sql`${table.startedAt} >= 0`),
		check('migration_runs_finished_at_check', sql`${table.finishedAt} is null or ${table.finishedAt} >= ${table.startedAt}`),
		check('migration_runs_attempt_check', sql`${table.attempt} >= 1`),
		check('migration_runs_error_json_check', sql`${table.errorJson} is null or json_valid(${table.errorJson})`),
		index('migration_runs_migration_started_at_index').on(table.migrationId, table.startedAt),
		index('migration_runs_status_started_at_index').on(table.status, table.startedAt),
	],
)

export type BrainMigrationRun = typeof migrationRuns.$inferSelect
export type NewBrainMigrationRun = typeof migrationRuns.$inferInsert
