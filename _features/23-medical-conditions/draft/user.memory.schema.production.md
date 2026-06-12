# Production snapshot: user.memory.schema.ts

Target: `backend/src/agents/brain/_schemas/user.memory.schema.ts`

**Status:** Shipped (**05-brain-memory-tools**). Optional mirror for `health.conditions` — **not** operational source for scan condition safety.

---

## Shipped file (excerpt — full file in repo)

```typescript
import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const userMemory = sqliteTable(
	'user_memory',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		namespace: text('namespace').notNull(),
		key: text('key').notNull(),
		value: text('value').notNull(),
		confidence: real('confidence').notNull().default(1.0),
		source: text('source').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		importance: integer('importance', { mode: 'number' }).notNull().default(5),
		readCount: integer('read_count', { mode: 'number' }).notNull().default(0),
		writeCount: integer('write_count', { mode: 'number' }).notNull().default(0),
		lastRead: integer('last_read', { mode: 'number' }),
		lastWrite: integer('last_write', { mode: 'number' }),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		// ... CHECK constraints and indexes — see repo file
	],
)
```

## Intended mirror entry (not shipped — example from `03-read-user-memory.md`)

```json
{
  "namespace": "health",
  "key": "conditions",
  "value": { "type2_diabetes": true },
  "confidence": 0.9
}
```

**23 rule:** Operational condition truth = `medical_condition_profiles` table. Mirror sync via `sync.health.conditions.memory.mirror.helper.ts` (gap) — prompt injection only.
