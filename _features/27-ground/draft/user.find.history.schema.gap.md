# Gap snapshot: user.find.history.schema.ts

Target: `backend/src/agents/brain/_schemas/user.find.history.schema.ts`

**Status:** Not in repo. Private Brain DO SQLite — from `build-guide/09-ground/01-find-data-model.md`.

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const userFindHistory = sqliteTable('user_find_history', {
  findId: text('find_id').primaryKey(),
  submittedAt: integer('submitted_at').notNull(),
  locationId: text('location_id').notNull(),
  signalType: text('signal_type')
    .notNull()
    .$type<'health' | 'ingredient' | 'price' | 'new_product' | 'general'>(),
  contentPreview: text('content_preview').notNull(),
})
```

**Privacy:** never synced to Supabase. Used for user's own submit history and haptic suppression (signal types user never acts on — 35b Angle 3).
