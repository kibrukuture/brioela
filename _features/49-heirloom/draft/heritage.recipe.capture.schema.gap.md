# Draft: heritage.recipe.capture.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/heritage.recipe.capture.schema.ts`

**Gap (feature 49):** `heritage_recipe_capture` header row — spec **13**.

**Source:** `brioela-specs/13-generational-recipe-capture.md`

---

```typescript
import { check, index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const heritageCaptureStatusValues = [
	'active',
	'draft_ready',
	'finalized',
	'abandoned',
] as const

export type HeritageCaptureStatus = (typeof heritageCaptureStatusValues)[number]

export const heritageRecipeCaptures = sqliteTable(
	'heritage_recipe_capture',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		sessionId: text('session_id').notNull(),
		roomId: text('room_id'),
		cookName: text('cook_name').notNull(),
		cookRelationship: text('cook_relationship'),
		consentObtainedAt: integer('consent_obtained_at', { mode: 'number' }).notNull(),
		status: text('status', { enum: heritageCaptureStatusValues })
			.notNull()
			.default('active'),
		recipeId: text('recipe_id'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'heritage_capture_status_check',
			sql`${table.status} in ('active', 'draft_ready', 'finalized', 'abandoned')`,
		),
		index('heritage_capture_user_status_index').on(table.userId, table.status),
		index('heritage_capture_session_id_index').on(table.sessionId),
	],
)

export type HeritageRecipeCaptureRow = typeof heritageRecipeCaptures.$inferSelect
export type NewHeritageRecipeCaptureRow = typeof heritageRecipeCaptures.$inferInsert
```
