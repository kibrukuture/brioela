# Draft: harvest.chapter.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/harvest.chapter.schema.ts`

**Gap (feature 53):** Per-chapter rows with mandatory traceability.

**Source:** `build-guide/36-harvest/03-grammar-rendering.md`, `01-composition-workflow.md` § Rule

---

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import type { HarvestChapterType } from '@brioela/shared/constants/harvest'

export const harvestChapters = sqliteTable('harvest_chapter', {
	chapterId: text('chapter_id').primaryKey(),
	editionId: text('edition_id').notNull(),
	chapterType: text('chapter_type').$type<HarvestChapterType>().notNull(),
	headline: text('headline').notNull(),
	body: text('body').notNull(),
	sourceQueriesJson: text('source_queries_json').notNull(),
	shareCardRef: text('share_card_ref'),
	shared: integer('shared', { mode: 'boolean' }).notNull().default(false),
	rank: integer('rank').notNull(),
})

export type HarvestChapterRow = typeof harvestChapters.$inferSelect
export type HarvestChapterInsert = typeof harvestChapters.$inferInsert
```
