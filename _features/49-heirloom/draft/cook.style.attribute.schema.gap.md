# Draft: cook.style.attribute.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/cook.style.attribute.schema.ts`

**Gap (feature 49):** Structured style attributes — spec **32**.

---

```typescript
import { check, index, integer, real, sqliteTable, text, sql } from '@/database/sqlite/_schema'

export const cookStyleAttributeTypeValues = [
	'seasoning',
	'technique',
	'substitution',
	'finishing',
] as const

export type CookStyleAttributeType = (typeof cookStyleAttributeTypeValues)[number]

export const cookStyleAttributes = sqliteTable(
	'cook_style_attribute',
	{
		id: text('id').primaryKey(),
		profileId: text('profile_id').notNull(),
		attributeType: text('attribute_type', { enum: cookStyleAttributeTypeValues }).notNull(),
		description: text('description').notNull(),
		confidenceScore: real('confidence_score').notNull(),
		sourceQuote: text('source_quote'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'cook_style_attribute_type_check',
			sql`${table.attributeType} in ('seasoning', 'technique', 'substitution', 'finishing')`,
		),
		index('cook_style_attribute_profile_index').on(table.profileId),
	],
)

export type CookStyleAttributeRow = typeof cookStyleAttributes.$inferSelect
export type NewCookStyleAttributeRow = typeof cookStyleAttributes.$inferInsert
```
