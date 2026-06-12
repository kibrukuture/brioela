# Draft: travel.preload.job.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/travel.preload.job.schema.ts`

**Gap (feature 35):** Tracks QStash / inline preload job per travel intent.

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const travelPreloadJobStatusValues = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const
export type TravelPreloadJobStatus = (typeof travelPreloadJobStatusValues)[number]

export const travelPreloadJobs = sqliteTable('travel_preload_job', {
  jobId: text('job_id').primaryKey(),
  intentId: text('intent_id').notNull(),
  userId: text('user_id').notNull(),
  jobType: text('job_type').notNull(),
  status: text('status').notNull().$type<TravelPreloadJobStatus>(),
  failureReason: text('failure_reason'),
  scheduledAlarmId: text('scheduled_alarm_id'),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
})

export type TravelPreloadJobRow = typeof travelPreloadJobs.$inferSelect
```
