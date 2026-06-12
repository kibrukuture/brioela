# Draft: mesa.food.audience.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.food.audience.schema.ts`

**Gap:** No `mesa_food_audience` persistence for sticky Food Audience.

**Source:** `build-guide/26-mesa/04-food-audience.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const foodAudienceModeValues = [
	'just_me',
	'mesa',
	'selected_members',
	'guest_session',
] as const

export const foodAudienceSourceValues = ['explicit', 'inferred', 'session_default'] as const

export const mesaFoodAudience = sqliteTable(
	'mesa_food_audience',
	{
		id: text('id').primaryKey(),
		mesaId: text('mesa_id'),
		mode: text('mode', { enum: foodAudienceModeValues }).notNull(),
		memberIdsJson: text('member_ids_json').notNull(),
		source: text('source', { enum: foodAudienceSourceValues }).notNull(),
		expiresAt: integer('expires_at', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'mesa_food_audience_member_ids_json_array_check',
			sql`json_valid(${table.memberIdsJson}) and json_type(${table.memberIdsJson}) = 'array'`,
		),
		check('mesa_food_audience_created_at_check', sql`${table.createdAt} >= 0`),
		index('mesa_food_audience_mesa_created_index').on(table.mesaId, table.createdAt),
	],
)

export type MesaFoodAudienceRow = typeof mesaFoodAudience.$inferSelect
```
