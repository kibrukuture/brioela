# Draft: share.prompt.suppression.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/share.prompt.suppression.schema.ts`

**Gap (feature 51):** Per-user dismissal window for share prompts.

**Source:** `build-guide/24-viral-sharing/06-growth-metrics-and-suppression.md`

---

```typescript
import { integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const sharePromptSuppressions = sqliteTable('share_prompt_suppression', {
	userId: text('user_id').primaryKey(),
	dismissCount7d: integer('dismiss_count_7d', { mode: 'number' }).notNull().default(0),
	windowStartedAt: integer('window_started_at', { mode: 'number' }).notNull(),
	lastDismissedAt: integer('last_dismissed_at', { mode: 'number' }),
	suppressedUntil: integer('suppressed_until', { mode: 'number' }),
})

export type BrainSharePromptSuppression = typeof sharePromptSuppressions.$inferSelect
export type InsertBrainSharePromptSuppression = typeof sharePromptSuppressions.$inferInsert
```
