# Draft: featured.listing.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/featured.listing.schema.ts`

Source: `brioela-specs/18-verified-business-and-practitioner-profiles.md`, `build-guide/23-verified-profiles/06-analytics-and-revenue.md`

**Rule:** `labeledPaidPlacement` must be true when user-facing paid boost applies. Ranking must not override safety.

---

```typescript
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const featuredListings = pgTable(
  'featured_listings',
  {
    listingId: uuid('listing_id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').notNull(),
    profileKind: text('profile_kind').notNull().$type<'verified_profile' | 'verified_business'>(),
    placeId: uuid('place_id'),
    active: boolean('active').notNull().default(true),
    labeledPaidPlacement: boolean('labeled_paid_placement').notNull().default(false),
    rankInputsJson: jsonb('rank_inputs_json').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileIdx: index('featured_listings_profile_idx').on(table.profileId, table.active),
    placeIdx: index('featured_listings_place_idx').on(table.placeId),
  }),
)

export type FeaturedListingRow = typeof featuredListings.$inferSelect
```
