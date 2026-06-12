# Draft: travel.intent.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/travel.intent.schema.ts`

**Gap (feature 35):** Travel intent lifecycle — voice, calendar, map search, manual.

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`, `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const travelIntentSourceValues = [
  'voice',
  'calendar',
  'map_search',
  'manual',
] as const
export type TravelIntentSource = (typeof travelIntentSourceValues)[number]

export const travelIntentStatusValues = [
  'pending',
  'confirmed',
  'active',
  'expired',
  'dismissed',
] as const
export type TravelIntentStatus = (typeof travelIntentStatusValues)[number]

export const travelIntents = sqliteTable('travel_intent', {
  intentId: text('intent_id').primaryKey(),
  userId: text('user_id').notNull(),
  destinationCity: text('destination_city').notNull(),
  destinationCountry: text('destination_country'),
  geoRegion: text('geo_region').notNull(),
  departureDate: integer('departure_date'),
  returnDate: integer('return_date'),
  source: text('source').notNull().$type<TravelIntentSource>(),
  confidence: real('confidence').notNull(),
  status: text('status').notNull().$type<TravelIntentStatus>(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type TravelIntentRow = typeof travelIntents.$inferSelect
```
