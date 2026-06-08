import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const userPersonality = sqliteTable(
	'user_personality',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		trait: text('trait').notNull().unique(),
		summary: text('summary').notNull(),
		evidence: text('evidence').notNull(),
		strength: real('strength').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		revisedCount: integer('revised_count', { mode: 'number' }).notNull().default(0),
		inferredAt: integer('inferred_at', { mode: 'number' }).notNull(),
		lastSeenAt: integer('last_seen_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('user_personality_evidence_json_array_check', sql`json_valid(${table.evidence}) and json_type(${table.evidence}) = 'array'`),
		check('user_personality_strength_check', sql`${table.strength} >= 0 and ${table.strength} <= 1`),
		check('user_personality_is_active_check', sql`${table.isActive} in (0, 1)`),
		check('user_personality_revised_count_check', sql`${table.revisedCount} >= 0`),
		check('user_personality_inferred_at_check', sql`${table.inferredAt} >= 0`),
		check('user_personality_last_seen_at_check', sql`${table.lastSeenAt} >= ${table.inferredAt}`),
		check('user_personality_updated_at_check', sql`${table.updatedAt} >= ${table.inferredAt}`),
		index('user_personality_is_active_strength_index').on(table.isActive, table.strength),
		index('user_personality_last_seen_at_index').on(table.lastSeenAt),
	],
)

export type BrainUserPersonality = typeof userPersonality.$inferSelect
export type NewBrainUserPersonality = typeof userPersonality.$inferInsert
