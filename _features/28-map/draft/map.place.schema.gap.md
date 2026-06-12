# Gap snapshot: map.place.schema.ts (Drizzle)

Target: `shared/drizzle/schema/map.place.schema.ts`

**Status:** Not in repo. From `build-guide/10-map/02-map-data-model.md`, spec 04.

```typescript
import { sql } from 'drizzle-orm'
import {
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core'

export const mapPlace = pgTable(
  'map_place',
  {
    placeId: uuid('place_id').primaryKey().defaultRandom(),
    kind: text('kind')
      .notNull()
      .$type<'store' | 'restaurant' | 'market' | 'stall' | 'trusted_business'>(),
    name: text('name').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    geohash: text('geohash').notNull(),
    verificationStatus: text('verification_status')
      .notNull()
      .default('unverified')
      .$type<'unverified' | 'pending' | 'verified'>(),
    addressJson: jsonb('address_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    geohashIdx: index('map_place_geohash_idx').on(table.geohash),
    kindCheck: sql`check (${table.kind} in ('store','restaurant','market','stall','trusted_business'))`,
    verificationCheck: sql`check (${table.verificationStatus} in ('unverified','pending','verified'))`,
  }),
)
```

**Blocks:** **27** `find.location_id` FK references this table.
