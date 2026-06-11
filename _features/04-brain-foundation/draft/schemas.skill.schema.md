# Draft: skill.schema.ts

Target: `backend/src/agents/brain/_schemas/skill.schema.ts`

```ts
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const skillSource = ['system', 'user'] as const
const skillStatus = ['active', 'stale', 'archived'] as const

export const skills = sqliteTable(
	'skills',
	{
		name: text('name').primaryKey(),
		userId: text('user_id').notNull(),
		description: text('description').notNull(),
		content: text('content').notNull(),
		tags: text('tags').notNull().default('[]'),
		source: text('source', { enum: skillSource }).notNull(),
		status: text('status', { enum: skillStatus }).notNull().default('active'),
		version: integer('version', { mode: 'number' }).notNull().default(1),
		useCount: integer('use_count', { mode: 'number' }).notNull().default(0),
		lastUsedAt: integer('last_used_at', { mode: 'number' }),
		archivedReason: text('archived_reason'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('skills_tags_json_array_check', sql`json_valid(${table.tags}) and json_type(${table.tags}) = 'array'`),
		check('skills_source_check', sql`${table.source} in ('system', 'user')`),
		check('skills_status_check', sql`${table.status} in ('active', 'stale', 'archived')`),
		check('skills_version_check', sql`${table.version} >= 1`),
		check('skills_use_count_check', sql`${table.useCount} >= 0`),
		check('skills_last_used_at_check', sql`${table.lastUsedAt} is null or ${table.lastUsedAt} >= 0`),
		check('skills_created_at_check', sql`${table.createdAt} >= 0`),
		check('skills_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('skills_status_use_count_index').on(table.status, table.useCount),
		index('skills_source_status_index').on(table.source, table.status),
		index('skills_last_used_at_index').on(table.lastUsedAt),
	],
)

export type BrainSkill = typeof skills.$inferSelect
export type NewBrainSkill = typeof skills.$inferInsert
```
