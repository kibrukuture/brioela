# Gap snapshot: location.signal.summary.schema.ts

Target: `shared/drizzle/schema/location.signal.summary.schema.ts`

**Status:** Not in repo. From `build-guide/09-ground/01-find-data-model.md`.

```typescript
import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const locationSignalSummary = pgTable(
  'location_signal_summary',
  {
    locationId: uuid('location_id').notNull(),
    signalType: text('signal_type')
      .notNull()
      .$type<'health' | 'ingredient' | 'price' | 'new_product' | 'general'>(),
    activeCount: integer('active_count').notNull().default(0),
    lastFindAt: timestamp('last_find_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.locationId, table.signalType] }),
  }),
)
```

**Map rendering rule:** this is the **only** table queried for Ground tile rendering. Update via trigger on `find` insert/update/delete or reconciled by `ground-summary-reconcile.job.ts`.
