# Draft: condition.rule.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/condition.rule.schema.ts`

Source: `build-guide/22-medical-conditions/03-condition-rule-config.md`

---

## Intended production file

```typescript
import { boolean, pgSchema, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

const brioela = pgSchema('brioela')

export const conditionRules = brioela.table(
	'condition_rule',
	{
		ruleId: text('rule_id').primaryKey(),
		conditionType: text('condition_type').notNull(),
		ruleVersion: text('rule_version').notNull(),
		triggerKind: text('trigger_kind').notNull(),
		triggerValue: text('trigger_value').notNull(),
		flagLevel: text('flag_level').notNull(),
		strictness: text('strictness').notNull().default('all'),
		reasonTemplate: text('reason_template').notNull(),
		evidenceSource: text('evidence_source'),
		reviewerMarker: text('reviewer_marker'),
		active: boolean('active').notNull().default(true),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('idx_condition_rule_type_version').on(table.conditionType, table.ruleVersion, table.active),
	],
)

export type ConditionRule = typeof conditionRules.$inferSelect
```

**Governance:** Active rows require human review (`evidenceSource`, `reviewerMarker`). LLM drafts are not promoted without review workflow.

**Cache:** Backend Redis key `condition_rules:{conditionType}:{ruleVersion}` — TTL short enough for rule updates.
