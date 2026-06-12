# Gap snapshot: alert.candidate.schema.ts (Drizzle)

Target: `shared/drizzle/schema/alert.candidate.schema.ts` + `delivered.alert.schema.ts`

**Status:** Not in repo. From `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`.

```typescript
import { sql } from 'drizzle-orm'
import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core'
import { mapPlace } from './map.place.schema'

export const alertCandidate = pgTable(
  'alert_candidate',
  {
    candidateId: uuid('candidate_id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    productId: text('product_id').notNull(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => mapPlace.placeId, { onDelete: 'cascade' }),
    alertType: text('alert_type')
      .notNull()
      .$type<'price_increase' | 'price_decrease' | 'nearby_opportunity'>(),
    score: doublePrecision('score').notNull(),
    pctChange: doublePrecision('pct_change').nullable(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    status: text('status')
      .notNull()
      .default('pending')
      .$type<'pending' | 'delivered' | 'suppressed'>(),
  },
  (table) => ({
    userStatusIdx: index('alert_candidate_user_status_idx').on(table.userId, table.status),
    typeCheck: sql`check (${table.alertType} in ('price_increase','price_decrease','nearby_opportunity'))`,
  }),
)

export const deliveredAlert = pgTable(
  'delivered_alert',
  {
    deliveredAlertId: uuid('delivered_alert_id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    alertType: text('alert_type').notNull(),
    objectId: text('object_id').notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userTypeDeliveredIdx: index('delivered_alert_user_type_idx').on(
      table.userId,
      table.alertType,
      table.deliveredAt,
    ),
  }),
)
```

**Delivery:** **21** reads pending candidates and writes `delivered_alert` after push.
