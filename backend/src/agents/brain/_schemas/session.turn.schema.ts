import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const turnRole = ['user', 'assistant', 'tool_call', 'tool_result'] as const

export const sessionTurns = sqliteTable(
	'session_turns',
	{
		id: text('id').primaryKey(),
		sessionId: text('session_id').notNull(),
		userId: text('user_id').notNull(),
		turnNumber: integer('turn_number', { mode: 'number' }).notNull(),
		role: text('role', { enum: turnRole }).notNull(),
		content: text('content').notNull(),
		toolName: text('tool_name'),
		toolInput: text('tool_input'),
		toolResult: text('tool_result'),
		inputTokens: integer('input_tokens', { mode: 'number' }).notNull().default(0),
		outputTokens: integer('output_tokens', { mode: 'number' }).notNull().default(0),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('session_turns_turn_number_check', sql`${table.turnNumber} >= 1`),
		check('session_turns_role_check', sql`${table.role} in ('user', 'assistant', 'tool_call', 'tool_result')`),
		check('session_turns_input_tokens_check', sql`${table.inputTokens} >= 0`),
		check('session_turns_output_tokens_check', sql`${table.outputTokens} >= 0`),
		check('session_turns_created_at_check', sql`${table.createdAt} >= 0`),
		index('session_turns_session_turn_number_index').on(table.sessionId, table.turnNumber),
		index('session_turns_user_created_at_index').on(table.userId, table.createdAt),
	],
)

export type BrainSessionTurn = typeof sessionTurns.$inferSelect
export type NewBrainSessionTurn = typeof sessionTurns.$inferInsert
