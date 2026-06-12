# Gap snapshot: cooking.timers.schema.ts

Target: `backend/src/agents/mira/_schemas/cooking.timers.schema.ts`

**Status:** Not in repo. Mira Agent local SQLite — authoritative timer state.

```typescript
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const cookingTimers = sqliteTable('cooking_timers', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	label: text('label').notNull(),
	firesAt: integer('fires_at', { mode: 'number' }).notNull(),
	status: text('status').notNull(),
	sdkScheduleId: text('sdk_schedule_id'),
	firedAt: integer('fired_at', { mode: 'number' }),
	cancelledAt: integer('cancelled_at', { mode: 'number' }),
	createdAt: integer('created_at', { mode: 'number' }).notNull(),
})

export const cookingTimersInitSql = sql`
CREATE TABLE IF NOT EXISTS cooking_timers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  label TEXT NOT NULL,
  fires_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'fired', 'cancelled')),
  sdk_schedule_id TEXT,
  fired_at INTEGER,
  cancelled_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cooking_timers_session_status_idx
  ON cooking_timers (session_id, status);
`
