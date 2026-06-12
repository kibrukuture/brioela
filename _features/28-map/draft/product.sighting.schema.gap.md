# Gap snapshot: product.sighting.schema.ts (Drizzle)

Target: `shared/drizzle/schema/product.sighting.schema.ts`

**Status:** Not in repo. From `build-guide/10-map/02-map-data-model.md`, `04-product-sightings.md`.

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

export const productSighting = pgTable(
  'product_sighting',
  {
    sightingId: uuid('sighting_id').primaryKey().defaultRandom(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => mapPlace.placeId, { onDelete: 'cascade' }),
    productId: text('product_id').notNull(),
    seenAt: timestamp('seen_at', { withTimezone: true }).notNull(),
    reporterUserId: uuid('reporter_user_id').notNull(),
    confidence: doublePrecision('confidence').notNull().default(0.8),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    placeProductIdx: index('product_sighting_place_product_idx').on(
      table.placeId,
      table.productId,
    ),
    confidenceRange: sql`check (${table.confidence} >= 0 and ${table.confidence} <= 1)`,
  }),
)
```

**Conflict:** `build-guide/02-coding-standards/07-data-layer-drizzle.md` example uses `storeId` + inline `price` — prefer this schema from `10-map/02`.
