# Draft: condition.flag.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/condition.flag.event.schema.ts`

Source: `build-guide/22-medical-conditions/04-scan-verdict-integration.md`

---

## Intended production file

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const entityKind = ['scan', 'recipe', 'menu_dish'] as const
const flagLevel = ['hard', 'soft', 'info'] as const

export const conditionFlagEvents = sqliteTable(
	'condition_flag_events',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		entityKind: text('entity_kind', { enum: entityKind }).notNull(),
		entityId: text('entity_id').notNull(),
		conditionType: text('condition_type').notNull(),
		flagLevel: text('flag_level', { enum: flagLevel }).notNull(),
		flagReason: text('flag_reason').notNull(),
		matchedRuleIds: text('matched_rule_ids').notNull().default('[]'),
		ruleVersion: text('rule_version').notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('condition_flag_events_matched_rule_ids_json_check', sql`json_valid(${table.matchedRuleIds}) and json_type(${table.matchedRuleIds}) = 'array'`),
		check('condition_flag_events_flag_level_check', sql`${table.flagLevel} in ('hard', 'soft', 'info')`),
		index('idx_condition_flag_events_entity').on(table.userId, table.entityKind, table.entityId),
		index('idx_condition_flag_events_condition').on(table.userId, table.conditionType, table.createdAt),
	],
)

export type BrainConditionFlagEvent = typeof conditionFlagEvents.$inferSelect
export type NewBrainConditionFlagEvent = typeof conditionFlagEvents.$inferInsert
```

**Privacy rule:** Never write condition flag events to Supabase community tables.
