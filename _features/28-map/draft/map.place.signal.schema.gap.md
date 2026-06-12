# Gap snapshot: map.place.signal.schema.ts (Drizzle)

Target: `shared/drizzle/schema/map.place.signal.schema.ts`

**Status:** Not in repo. From `build-guide/10-map/02-map-data-model.md`.

```typescript
import { sql } from 'drizzle-orm'
import {
  doublePrecision,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { mapPlace } from './map.place.schema'

export const mapPlaceSignal = pgTable(
  'map_place_signal',
  {
    placeId: uuid('place_id')
      .primaryKey()
      .references(() => mapPlace.placeId, { onDelete: 'cascade' }),
    healthyScore: doublePrecision('healthy_score').notNull(),
    communityScore: doublePrecision('community_score').notNull(),
    affordabilityScore: doublePrecision('affordability_score').notNull(),
    recencyScore: doublePrecision('recency_score').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    healthyRange: sql`check (${table.healthyScore} >= 0 and ${table.healthyScore} <= 1)`,
    communityRange: sql`check (${table.communityScore} >= 0 and ${table.communityScore} <= 1)`,
    affordabilityRange: sql`check (${table.affordabilityScore} >= 0 and ${table.affordabilityScore} <= 1)`,
    recencyRange: sql`check (${table.recencyScore} >= 0 and ${table.recencyScore} <= 1)`,
  }),
)
```

**Boundary:** Never merge with **27** `location_signal_summary` — different truth types.
