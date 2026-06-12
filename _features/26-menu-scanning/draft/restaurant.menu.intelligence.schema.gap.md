# Gap snapshot: restaurant.menu intelligence schemas

Target: `shared/drizzle/schema/restaurant.menu.*.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/06-shared-menu-intelligence.md`.

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
} from 'drizzle-orm/pg-core'

export const restaurantMenuSource = pgTable('restaurant_menu_source', {
  sourceId: uuid('source_id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').notNull(),
  sourceType: text('source_type', {
    enum: ['qr_url', 'url', 'photo_vision_extraction', 'merchant_feed'],
  }).notNull(),
  resolvedUrl: text('resolved_url'),
  urlHash: text('url_hash'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  scanCount: integer('scan_count').notNull().default(1),
  status: text('status', {
    enum: ['active', 'stale', 'blocked', 'needs_review'],
  }).notNull(),
  confidence: numeric('confidence').notNull(),
})

export const restaurantMenuVersion = pgTable('restaurant_menu_version', {
  versionId: uuid('version_id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').notNull(),
  sourceId: uuid('source_id').references(() => restaurantMenuSource.sourceId),
  menuFingerprint: text('menu_fingerprint').notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  observedCount: integer('observed_count').notNull().default(1),
  status: text('status', {
    enum: ['current', 'superseded', 'uncertain'],
  }).notNull(),
})

export const restaurantMenuDish = pgTable('restaurant_menu_dish', {
  dishId: uuid('dish_id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').notNull(),
  versionId: uuid('version_id').references(() => restaurantMenuVersion.versionId),
  section: text('section'),
  name: text('name').notNull(),
  description: text('description'),
  priceText: text('price_text'),
  ingredientTerms: text('ingredient_terms').array().notNull().default([]),
  cookingMethod: text('cooking_method'),
  confidence: numeric('confidence').notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
})

export const restaurantDishSignalSummary = pgTable(
  'restaurant_dish_signal_summary',
  {
    dishId: uuid('dish_id')
      .notNull()
      .references(() => restaurantMenuDish.dishId),
    signalKind: text('signal_kind', {
      enum: [
        'allergen_visible',
        'hidden_ingredient_risk',
        'shared_prep_risk',
        'dietary_fit',
        'price_value',
        'community_correction',
      ],
    }).notNull(),
    signalValue: text('signal_value').notNull(),
    observedCount: integer('observed_count').notNull().default(0),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    confidence: numeric('confidence').notNull(),
  },
  (table) => ({
    pk: { columns: [table.dishId, table.signalKind, table.signalValue] },
  }),
)

export const restaurantFitSummary = pgTable('restaurant_fit_summary', {
  placeId: uuid('place_id').primaryKey(),
  allergyClarityScore: numeric('allergy_clarity_score'),
  dietaryFitScore: numeric('dietary_fit_score'),
  affordabilityScore: numeric('affordability_score'),
  menuFreshnessScore: numeric('menu_freshness_score'),
  communityConfidenceScore: numeric('community_confidence_score'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})
```

**Privacy rule:** Never store user health profiles or personalized verdicts in these tables.
