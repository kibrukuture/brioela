# Draft: kin.state.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/kin.state.schema.ts`

**Gap (feature 50):** Private Brain DO Kin consent + assignment state — spec **47**.

---

```typescript
import { check, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const kinState = sqliteTable(
	'kin_state',
	{
		userId: text('user_id').primaryKey(),
		optedIn: integer('opted_in', { mode: 'boolean' }).notNull().default(false),
		clusterId: text('cluster_id'),
		fingerprintJson: text('fingerprint_json'),
		assignedAt: integer('assigned_at', { mode: 'number' }),
		lastContributionAt: integer('last_contribution_at', { mode: 'number' }),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'kin_state_fingerprint_json_object_check',
			`${table.fingerprintJson.name} IS NULL OR (json_valid(${table.fingerprintJson.name}) AND json_type(${table.fingerprintJson.name}) = 'object')`,
		),
	],
)

export type BrainKinState = typeof kinState.$inferSelect
export type InsertBrainKinState = typeof kinState.$inferInsert
```

`fingerprint_json` is **never** transmitted off-DO — stored for reassignment only.
