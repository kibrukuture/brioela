# Draft: time.machine.moment.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/time.machine.moment.schema.ts`

**Gap (feature 35):** Ranked private history moments — 14d expiry, no push.

**Source:** `brioela-specs/38-food-time-machine.md`, `build-guide/18-ambient-intelligence/04-food-time-machine.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const timeMachineMomentTypeValues = [
  'first_time',
  'staple_count',
  'long_gap',
  'on_this_day',
  'milestone',
  'generational_recipe',
] as const
export type TimeMachineMomentType = (typeof timeMachineMomentTypeValues)[number]

export const timeMachineSurfaceValues = [
  'scan',
  'recipe_open',
  'app_open',
  'weekly_summary',
] as const
export type TimeMachineSurface = (typeof timeMachineSurfaceValues)[number]

export const timeMachineEntityKindValues = [
  'product',
  'recipe',
  'ingredient',
  'category',
  'app',
] as const
export type TimeMachineEntityKind = (typeof timeMachineEntityKindValues)[number]

export const timeMachineMoments = sqliteTable('time_machine_moment', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  momentType: text('moment_type').notNull().$type<TimeMachineMomentType>(),
  surface: text('surface').notNull().$type<TimeMachineSurface>(),
  text: text('text').notNull(),
  entityKind: text('entity_kind').notNull().$type<TimeMachineEntityKind>(),
  entityId: text('entity_id'),
  salience: real('salience').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  surfacedAt: integer('surfaced_at'),
})

export type TimeMachineMomentRow = typeof timeMachineMoments.$inferSelect
```
