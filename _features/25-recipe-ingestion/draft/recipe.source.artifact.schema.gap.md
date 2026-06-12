# Gap snapshot: recipe.source.artifact.schema.ts

Target: `shared/drizzle/schema/recipe.source.artifact.schema.ts`

**Status:** Not in repo. Evidence retention per `03-source-extraction.md`, `06-storage-and-library.md`.

```typescript
import { pgTable, text, integer, index } from 'drizzle-orm/pg-core'

export const recipeSourceArtifacts = pgTable(
	'recipe_source_artifacts',
	{
		id: text('id').primaryKey(),
		importJobId: text('import_job_id').notNull(),
		userId: text('user_id').notNull(),
		transcript: text('transcript'),
		captions: text('captions'),
		extractedPageText: text('extracted_page_text'),
		extractedImageText: text('extracted_image_text'),
		thumbnailUrl: text('thumbnail_url'),
		canonicalUrl: text('canonical_url'),
		authorName: text('author_name'),
		extractionWarningsJson: text('extraction_warnings_json').notNull().default('[]'),
		createdAt: integer('created_at').notNull(),
	},
	(table) => [
		index('recipe_source_artifacts_job_idx').on(table.importJobId),
		index('recipe_source_artifacts_user_idx').on(table.userId, table.createdAt),
	],
)

export type RecipeSourceArtifactRow = typeof recipeSourceArtifacts.$inferSelect
export type NewRecipeSourceArtifactRow = typeof recipeSourceArtifacts.$inferInsert
```
