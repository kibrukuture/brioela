# Draft: harvest.edition.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/harvest.edition.schema.ts`

**Gap (feature 53):** Brain SQLite edition archive — stored grammar document set.

**Source:** `build-guide/36-harvest/03-grammar-rendering.md`

---

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const harvestEditions = sqliteTable('harvest_edition', {
	editionId: text('edition_id').primaryKey(),
	userId: text('user_id').notNull(),
	yearIndex: integer('year_index').notNull(),
	periodStart: integer('period_start').notNull(),
	periodEnd: integer('period_end').notNull(),
	chapterCount: integer('chapter_count').notNull(),
	documentSetJson: text('document_set_json').notNull(),
	coverShareCardRef: text('cover_share_card_ref'),
	generatedAt: integer('generated_at').notNull(),
	openedAt: integer('opened_at'),
})

export type HarvestEditionRow = typeof harvestEditions.$inferSelect
export type HarvestEditionInsert = typeof harvestEditions.$inferInsert
```
