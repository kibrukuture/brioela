# Draft: agent.state.schema.ts

Target: `backend/src/agents/brain/_schemas/agent.state.schema.ts`

```ts
import { check, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const agentState = sqliteTable(
	'agent_state',
	{
		key: text('key').primaryKey(),
		userId: text('user_id').notNull(),
		value: text('value').notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('agent_state_value_json_check', sql`json_valid(${table.value})`),
		check('agent_state_updated_at_check', sql`${table.updatedAt} >= 0`),
	],
)

export type BrainAgentState = typeof agentState.$inferSelect
export type NewBrainAgentState = typeof agentState.$inferInsert
```
