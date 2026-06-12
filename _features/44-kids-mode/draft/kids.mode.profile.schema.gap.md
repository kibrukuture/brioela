# Draft: kids.mode.profile.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/kids.mode.profile.schema.ts`

**Gap:** No `kids_mode_profile` table.

**Source:** `build-guide/21-kids-mode/01-kids-profile.md`, `06-data-model-and-metrics.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const kidsModeAgeRangeValues = ['5-7', '8-10', '11-12'] as const
export type KidsModeAgeRange = (typeof kidsModeAgeRangeValues)[number]

export const kidsModeProfile = sqliteTable(
	'kids_mode_profile',
	{
		userId: text('user_id').primaryKey(),
		enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
		ageRange: text('age_range', { enum: kidsModeAgeRangeValues })
			.notNull()
			.default('8-10'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'kids_mode_profile_age_range_check',
			sql`${table.ageRange} in ('5-7', '8-10', '11-12')`,
		),
		check('kids_mode_profile_created_at_check', sql`${table.createdAt} >= 0`),
		check('kids_mode_profile_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('kids_mode_profile_enabled_index').on(table.enabled),
	],
)

export type KidsModeProfileRow = typeof kidsModeProfile.$inferSelect
export type NewKidsModeProfileRow = typeof kidsModeProfile.$inferInsert
```
