# Gap snapshot: shared.import.job.schema.ts

Target: `shared/drizzle/schema/shared.import.job.schema.ts`

**Status:** Not in repo. Single job table (G18 resolution — not separate `recipe_import_job`).

```typescript
import { pgTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const sharedImportJobStatus = [
	'queued',
	'classifying',
	'extracting',
	'normalizing',
	'routing',
	'needs_review',
	'completed',
	'partial',
	'failed',
] as const

export const sharedImportJobRoute = [
	'unknown',
	'recipe',
	'menu',
	'place',
	'product',
	'receipt',
	'memory_note',
] as const

export const sharedImportJobs = pgTable(
	'shared_import_jobs',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		sourceType: text('source_type').notNull(),
		sourceUrl: text('source_url'),
		sourceApp: text('source_app'),
		titleHint: text('title_hint'),
		previewText: text('preview_text'),
		thumbnailUrl: text('thumbnail_url'),
		dedupeKey: text('dedupe_key').notNull(),
		route: text('route', { enum: sharedImportJobRoute }).notNull().default('unknown'),
		status: text('status', { enum: sharedImportJobStatus }).notNull().default('queued'),
		recipeId: text('recipe_id'),
		confidence: real('confidence'),
		failureReason: text('failure_reason'),
		warningsJson: text('warnings_json').notNull().default('[]'),
		startedAt: integer('started_at').notNull(),
		completedAt: integer('completed_at'),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull(),
	},
	(table) => [
		index('shared_import_jobs_user_status_idx').on(table.userId, table.status, table.updatedAt),
		uniqueIndex('shared_import_jobs_dedupe_key_idx').on(table.userId, table.dedupeKey),
	],
)

export type SharedImportJob = typeof sharedImportJobs.$inferSelect
export type NewSharedImportJob = typeof sharedImportJobs.$inferInsert
```
