# Draft: medication.food.interaction.rule.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/medication.food.interaction.rule.schema.ts`

Source: `build-guide/22-medical-conditions/03-condition-rule-config.md`, `brioela-specs/34-universal-visual-intake.md`, `_features/22-health-intelligence/spec.md` (boundary: **23** owns config)

---

## Intended production file

```typescript
import { boolean, pgSchema, text, timestamp, index } from 'drizzle-orm/pg-core'

const brioela = pgSchema('brioela')

export const medicationFoodInteractionRules = brioela.table(
	'medication_food_interaction_rule',
	{
		ruleId: text('rule_id').primaryKey(),
		medicationClass: text('medication_class').notNull(),
		triggerKind: text('trigger_kind').notNull(),
		triggerValue: text('trigger_value').notNull(),
		flagLevel: text('flag_level').notNull(),
		reasonTemplate: text('reason_template').notNull(),
		evidenceSource: text('evidence_source'),
		active: boolean('active').notNull().default(true),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('idx_med_food_rule_class').on(table.medicationClass, table.active),
	],
)

export type MedicationFoodInteractionRule = typeof medicationFoodInteractionRules.$inferSelect
```

**Boundary:** **22** owns private `medications` rows (`medication_category`). **24** scan path reads active meds via Brain RPC, then fetches matching rules from this table. Community `anonymous_medication_food_event_associations` (**22**) is caution-only — never hard block alone.
