import { check, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const readinessStatus = [
	'ready',
	'migrating',
	'blocked_by_control_plane',
	'needs_retry',
	'migration_failed',
	'read_only_degraded',
	'incompatible_code',
] as const

const smokeStatus = ['passed', 'failed'] as const

export const schemaReadiness = sqliteTable(
	'brain_schema_readiness',
	{
		id: text('id').primaryKey().default('brain'),
		schemaVersion: integer('schema_version', { mode: 'number' }).notNull(),
		minReadableVersion: integer('min_readable_version', { mode: 'number' }).notNull(),
		targetVersion: integer('target_version', { mode: 'number' }).notNull(),
		status: text('status', { enum: readinessStatus }).notNull(),
		lastMigrationId: text('last_migration_id'),
		lastSmokeStatus: text('last_smoke_status', { enum: smokeStatus }),
		lastErrorJson: text('last_error_json'),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('brain_schema_readiness_schema_version_check', sql`${table.schemaVersion} >= 0`),
		check('brain_schema_readiness_min_readable_version_check', sql`${table.minReadableVersion} >= 0`),
		check('brain_schema_readiness_target_version_check', sql`${table.targetVersion} >= ${table.minReadableVersion}`),
		check(
			'brain_schema_readiness_status_check',
			sql`${table.status} in ('ready', 'migrating', 'blocked_by_control_plane', 'needs_retry', 'migration_failed', 'read_only_degraded', 'incompatible_code')`,
		),
		check(
			'brain_schema_readiness_last_smoke_status_check',
			sql`${table.lastSmokeStatus} is null or ${table.lastSmokeStatus} in ('passed', 'failed')`,
		),
		check('brain_schema_readiness_last_error_json_check', sql`${table.lastErrorJson} is null or json_valid(${table.lastErrorJson})`),
		check('brain_schema_readiness_updated_at_check', sql`${table.updatedAt} >= 0`),
	],
)

export type BrainSchemaReadiness = typeof schemaReadiness.$inferSelect
export type NewBrainSchemaReadiness = typeof schemaReadiness.$inferInsert
