# Draft: recipe.tool.test.schema.helper

Target: `backend/src/agents/brain/_tools/recipe.tool.test.schema.helper.ts`

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { sql } from '@/database/sqlite/_schema'

export function ensureRecipeToolTestSchema(database: BrainDatabase): void {
	database.run(sql`
		CREATE TABLE IF NOT EXISTS recipes (
			id TEXT PRIMARY KEY NOT NULL,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			origin TEXT NOT NULL,
			session_id TEXT,
			link_url TEXT,
			content TEXT NOT NULL,
			version INTEGER NOT NULL DEFAULT 1,
			cook_count INTEGER NOT NULL DEFAULT 0,
			last_cooked_at INTEGER,
			status TEXT NOT NULL DEFAULT 'active',
			confidence REAL NOT NULL DEFAULT 1,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			CONSTRAINT recipes_content_json_object_check CHECK(json_valid(content) AND json_type(content) = 'object'),
			CONSTRAINT recipes_title_matches_content_check CHECK(json_extract(content, '$.title') = title),
			CONSTRAINT recipes_version_check CHECK(version >= 1),
			CONSTRAINT recipes_cook_count_check CHECK(cook_count >= 0),
			CONSTRAINT recipes_last_cooked_at_check CHECK(last_cooked_at IS NULL OR last_cooked_at >= 0),
			CONSTRAINT recipes_status_check CHECK(status IN ('active', 'archived')),
			CONSTRAINT recipes_confidence_check CHECK(confidence >= 0 AND confidence <= 1),
			CONSTRAINT recipes_created_at_check CHECK(created_at >= 0),
			CONSTRAINT recipes_updated_at_check CHECK(updated_at >= created_at)
		)
	`)

	database.run(sql`
		CREATE TABLE IF NOT EXISTS recipe_versions (
			id TEXT PRIMARY KEY NOT NULL,
			recipe_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			version INTEGER NOT NULL,
			content TEXT NOT NULL,
			updated_by TEXT NOT NULL,
			update_reason TEXT NOT NULL,
			archived_at INTEGER NOT NULL,
			CONSTRAINT recipe_versions_version_check CHECK(version >= 1),
			CONSTRAINT recipe_versions_updated_by_check CHECK(updated_by IN ('agent', 'brain_maintenance')),
			CONSTRAINT recipe_versions_archived_at_check CHECK(archived_at >= 0)
		)
	`)
}
```
