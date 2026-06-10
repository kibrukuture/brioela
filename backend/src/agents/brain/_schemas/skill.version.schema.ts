import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const skillVersions = sqliteTable(
	'skill_versions',
	{
		id: text('id').primaryKey(),
		skillName: text('skill_name').notNull(),
		userId: text('user_id').notNull(),
		version: integer('version', { mode: 'number' }).notNull(),
		content: text('content').notNull(),
		reason: text('reason').notNull(),
		archivedAt: integer('archived_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('skill_versions_version_check', sql`${table.version} >= 1`),
		check('skill_versions_archived_at_check', sql`${table.archivedAt} >= 0`),
		index('skill_versions_skill_name_version_index').on(table.skillName, table.version),
	],
)

export type BrainSkillVersion = typeof skillVersions.$inferSelect
export type NewBrainSkillVersion = typeof skillVersions.$inferInsert
