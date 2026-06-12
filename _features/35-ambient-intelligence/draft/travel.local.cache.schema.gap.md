# Draft: travel.local.cache.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/travel.local.cache.schema.ts`

**Gap (feature 35):** Brain SQLite mirror of user-scoped destination cache; Redis holds geo blobs (**28** reads).

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`, `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const travelCacheTypeValues = [
  'map',
  'products',
  'community',
  'labeling',
  'menus',
] as const
export type TravelCacheType = (typeof travelCacheTypeValues)[number]

export const travelLocalCaches = sqliteTable('travel_local_cache', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  intentId: text('intent_id').notNull(),
  geoRegion: text('geo_region').notNull(),
  cacheType: text('cache_type').notNull().$type<TravelCacheType>(),
  payloadJson: text('payload_json').notNull(),
  redisKey: text('redis_key'),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
})

export type TravelLocalCacheRow = typeof travelLocalCaches.$inferSelect
```

Redis key convention: `travel:{userId}:{geoRegion}:{cacheType}` — user-scoped, never shared targeting.
