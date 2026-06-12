# Gap snapshot: price.sighting.schema.ts (Drizzle)

Target: `shared/drizzle/schema/price.sighting.schema.ts`

**Status:** Not in repo. From `build-guide/10-map/02-map-data-model.md`, spec 15.

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

export const priceSighting = pgTable(
  'price_sighting',
  {
    priceSightingId: uuid('price_sighting_id').primaryKey().defaultRandom(),
    productId: text('product_id').notNull(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => mapPlace.placeId, { onDelete: 'cascade' }),
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').notNull(),
    seenAt: timestamp('seen_at', { withTimezone: true }).notNull(),
    reporterUserId: uuid('reporter_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    placeProductSeenIdx: index('price_sighting_place_product_seen_idx').on(
      table.placeId,
      table.productId,
      table.seenAt,
    ),
    amountPositive: sql`check (${table.amount} > 0)`,
  }),
)
```

**Input paths:** receipt parse (**33**), user report, normalized Ground price Finds (**27**).
