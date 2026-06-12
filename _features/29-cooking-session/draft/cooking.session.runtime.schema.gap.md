# Gap snapshot: cooking.session.runtime.schema.ts

Target: `backend/src/agents/mira/_schemas/cooking.session.runtime.schema.ts`

**Status:** Not in repo. Mira Agent local SQLite — recovery bootstrap only.

```typescript
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const cookingSessionRuntime = sqliteTable('cooking_session_runtime', {
	sessionId: text('session_id').primaryKey(),
	userId: text('user_id').notNull(),
	meetingId: text('meeting_id').notNull(),
	status: text('status').notNull(),
	mobileDisconnectDeadline: integer('mobile_disconnect_deadline', { mode: 'number' }),
	updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})

export const cookingSessionRuntimeInitSql = sql`
CREATE TABLE IF NOT EXISTS cooking_session_runtime (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meeting_id TEXT NOT NULL,
  status TEXT NOT NULL,
  mobile_disconnect_deadline INTEGER,
  updated_at INTEGER NOT NULL
);
`
