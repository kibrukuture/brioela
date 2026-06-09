import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const sessionKind = ['chat', 'cooking', 'alarm', 'background'] as const
const sessionStatus = ['active', 'completed', 'compressed', 'abandoned'] as const

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		sessionType: text('session_type', { enum: sessionKind }).notNull(),
		parentSessionId: text('parent_session_id'),
		recipeId: text('recipe_id'),
		alarmType: text('alarm_type'),
		status: text('status', { enum: sessionStatus }).notNull().default('active'),
		outcomeSummary: text('outcome_summary'),
		model: text('model').notNull(),
		inputTokens: integer('input_tokens', { mode: 'number' }).notNull().default(0),
		outputTokens: integer('output_tokens', { mode: 'number' }).notNull().default(0),
		cacheReadTokens: integer('cache_read_tokens', { mode: 'number' }).notNull().default(0),
		cacheWriteTokens: integer('cache_write_tokens', { mode: 'number' }).notNull().default(0),
		estimatedCostUsd: real('estimated_cost_usd'),
		turnCount: integer('turn_count', { mode: 'number' }).notNull().default(0),
		skillsCreated: integer('skills_created', { mode: 'number' }).notNull().default(0),
		constraintsProposed: integer('constraints_proposed', { mode: 'number' }).notNull().default(0),
		memoryWrites: integer('memory_writes', { mode: 'number' }).notNull().default(0),
		startedAt: integer('started_at', { mode: 'number' }).notNull(),
		endedAt: integer('ended_at', { mode: 'number' }),
		endReason: text('end_reason'),
	},
	(table) => [
		check('sessions_session_type_check', sql`${table.sessionType} in ('chat', 'cooking', 'alarm', 'background')`),
		check('sessions_status_check', sql`${table.status} in ('active', 'completed', 'compressed', 'abandoned')`),
		check('sessions_input_tokens_check', sql`${table.inputTokens} >= 0`),
		check('sessions_output_tokens_check', sql`${table.outputTokens} >= 0`),
		check('sessions_cache_read_tokens_check', sql`${table.cacheReadTokens} >= 0`),
		check('sessions_cache_write_tokens_check', sql`${table.cacheWriteTokens} >= 0`),
		check('sessions_estimated_cost_usd_check', sql`${table.estimatedCostUsd} is null or ${table.estimatedCostUsd} >= 0`),
		check('sessions_turn_count_check', sql`${table.turnCount} >= 0`),
		check('sessions_skills_created_check', sql`${table.skillsCreated} >= 0`),
		check('sessions_constraints_proposed_check', sql`${table.constraintsProposed} >= 0`),
		check('sessions_memory_writes_check', sql`${table.memoryWrites} >= 0`),
		check('sessions_started_at_check', sql`${table.startedAt} >= 0`),
		check('sessions_ended_at_check', sql`${table.endedAt} is null or ${table.endedAt} >= ${table.startedAt}`),
		index('sessions_user_status_started_at_index').on(table.userId, table.status, table.startedAt),
		index('sessions_type_status_started_at_index').on(table.sessionType, table.status, table.startedAt),
		index('sessions_parent_index').on(table.parentSessionId).where(sql`parent_session_id IS NOT NULL`),
		index('sessions_recipe_index').on(table.recipeId).where(sql`recipe_id IS NOT NULL`),
		index('sessions_started_at_index').on(table.startedAt),
		index('sessions_active_index').on(table.status).where(sql`status = 'active'`),
	],
)

export type BrainSession = typeof sessions.$inferSelect
export type NewBrainSession = typeof sessions.$inferInsert
