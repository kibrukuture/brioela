# Scanner — Product Resolution

## What This File Covers

How a UPC becomes a full product profile: Open Food Facts as the primary source, country-specific government databases as secondary sources, Upstash Redis caching, the canonical product table in Supabase, and what happens when no product is found.

---

## Resolution Stack — Three Layers

```
UPC received
     ↓
Layer 1: Upstash Redis cache check
  Hit  → return cached product (<500ms)
  Miss → continue
     ↓
Layer 2: Supabase products table check
  Found → update Redis cache, return product (<500ms)
  Miss  → continue
     ↓
Layer 3: External API resolution
  Open Food Facts (primary — 3.3M+ products globally)
  + country-specific gov DB (based on user geo)
  → write to Supabase products table
  → write to Redis cache
  → return product (~1–2s)
  Not found → return null, mark scan_event as 'unresolved'
```

Cache hit path is always under 500ms. External API path adds ~1–2s but this is the slow path, not the common one.

---

## Layer 1 — Upstash Redis Cache

Redis key: `product:{upc}`. TTL: 7 days. Value: the full product JSON.

```typescript
// backend/src/api/scan/_helpers/resolve.product.helper.ts

import { Redis } from '@upstash/redis'
import type { Env } from '@/types/env'
import type { Product } from '@brioela/shared'

export async function resolveProduct(
  upc: string,
  userId: string,
  env: Env,
): Promise<Product | null> {
  const redis = new Redis({
    url:   env.UPSTASH_REDIS_URL,
    token: env.UPSTASH_REDIS_TOKEN,
  })

  // Layer 1: Redis cache
  const cacheKey = `product:${upc}`
  const cached   = await redis.get<Product>(cacheKey)
  if (cached) return cached

  // Layer 2: Supabase canonical products table
  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('upc', upc)
    .maybeSingle()

  if (existing) {
    await redis.set(cacheKey, existing, { ex: 7 * 24 * 60 * 60 })  // 7 days TTL
    return existing as Product
  }

  // Layer 3: External APIs
  const resolved = await fetchFromExternalSources(upc, userId, env)
  if (!resolved) return null

  // Persist to Supabase
  await supabase.from('products').insert(resolved)

  // Cache in Redis
  await redis.set(cacheKey, resolved, { ex: 7 * 24 * 60 * 60 })

  return resolved
}
```

---

## Layer 3 — External API Resolution

### Primary: Open Food Facts

Open Food Facts is the primary source. 3.3M+ products, global coverage, free API, MIT license. Always tried first.

```typescript
async function fetchFromOpenFoodFacts(upc: string): Promise<Product | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${upc}.json?fields=product_name,brands,ingredients_text,nutriments,countries_tags,additives_tags,allergens_tags,manufacturing_places,image_url`,
    { headers: { 'User-Agent': 'Brioela/1.0 (brioela.com; contact@brioela.com)' } }
  )

  if (!response.ok) return null
  const data = await response.json() as OpenFoodFactsResponse

  if (data.status !== 1 || !data.product) return null

  const p = data.product
  return {
    id:           crypto.randomUUID(),
    upc,
    name:         p.product_name ?? 'Unknown Product',
    brand:        p.brands ?? null,
    ingredients:  parseIngredients(p.ingredients_text),
    nutrients:    parseNutrients(p.nutriments),
    originCountry: extractFirstCountry(p.countries_tags),
    additives:    p.additives_tags ?? [],
    allergens:    p.allergens_tags ?? [],
    imageUrl:     p.image_url ?? null,
    source:       'open_food_facts',
    sourceRefs:   [{ source: 'open_food_facts', id: upc }],
    resolvedAt:   Date.now(),
  }
}
```

### Secondary: Country-Specific Government Databases

Selected based on the user's geo (their `geoHash` → country code). Only queried when Open Food Facts returns null or a low-confidence result.

```typescript
const GOV_DB_BY_COUNTRY: Record<string, string> = {
  US: 'https://api.nal.usda.gov/fdc/v1/foods/search',
  GB: 'https://api.data.gov.uk/food/foods',
  CA: 'https://food-nutrition.canada.ca/cnf-fce/apiServlet',
  AU: 'https://api.foodstandards.gov.au/v1/foods',
  // more added as Brioela expands regions
}

async function fetchFromGovDB(upc: string, countryCode: string, env: Env): Promise<Product | null> {
  const endpoint = GOV_DB_BY_COUNTRY[countryCode]
  if (!endpoint) return null

  // Each gov DB has its own request/response shape — country-specific adapters
  return fetchGovDBProduct(upc, countryCode, endpoint, env)
}
```

### Resolution Flow

```typescript
async function fetchFromExternalSources(
  upc: string,
  userId: string,
  env: Env,
): Promise<Product | null> {
  // Determine user's country from their geoHash
  const countryCode = await getUserCountry(userId, env)

  // Always try Open Food Facts first
  const offResult = await fetchFromOpenFoodFacts(upc)
  if (offResult) return offResult

  // Fall back to country-specific gov DB
  if (countryCode) {
    const govResult = await fetchFromGovDB(upc, countryCode, env)
    if (govResult) return govResult
  }

  return null
}
```

---

## Supabase Schema — `products` Table

Shared cross-user data. Once a product is resolved, every subsequent user scanning the same UPC gets it from cache or Supabase — never from the external API again.

```typescript
// shared/drizzle/schema/products.schema.ts

import { pgSchema, text, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

export const products = brioela.table('products', {
  id:            uuid('id').primaryKey().defaultRandom(),
  upc:           text('upc').notNull().unique(),
  name:          text('name').notNull(),
  brand:         text('brand'),
  ingredients:   jsonb('ingredients'),         -- parsed ingredient array
  nutrients:     jsonb('nutrients'),           -- standardized nutrient map
  originCountry: text('origin_country'),
  additives:     jsonb('additives'),           -- additive codes (E-numbers)
  allergens:     jsonb('allergens'),           -- allergen tags
  imageUrl:      text('image_url'),
  source:        text('source').notNull(),     -- 'open_food_facts' | 'usda' | 'manual'
  sourceRefs:    jsonb('source_refs'),         -- [{ source, id }] — traceability
  resolvedAt:    timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

---

## Origin and Parent Company

Displayed in the expanded scan result. Stored in a separate `product_origin` table — origin data changes independently of product data (parent company acquisitions, country changes).

```typescript
// shared/drizzle/schema/products.schema.ts — additional table

export const productOrigin = brioela.table('product_origin', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  productId:           uuid('product_id').notNull().references(() => products.id),
  originCountry:       text('origin_country'),
  manufacturingCountry: text('manufacturing_country'),
  parentCompany:       text('parent_company'),
  parentCompanyId:     text('parent_company_id'),
  sourceRefs:          jsonb('source_refs'),
  effectiveFrom:       timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
})
```

Origin data is versioned (`effective_from`) — if a brand is acquired, the new parent company entry is inserted with today's date, the old row stays. Users see current ownership; audit trail preserved.

---

## Pending Scan Queue — When No Product Is Found

When a UPC cannot be resolved from any source, the scan_event is marked `status: 'unresolved'` and written to a `pending_scans` table. An Upstash QStash cron job retries unresolved scans daily — products are added to Open Food Facts continuously, so a product unknown today may be in the database tomorrow.

```typescript
// If resolveProduct returns null:
await supabase.from('pending_scans').insert({
  id:         crypto.randomUUID(),
  user_id:    userId,
  upc:        input.upc,
  scan_event_id: scanEventId,
  attempts:   0,
  created_at: new Date().toISOString(),
})
```

The user sees: "We don't recognise this product yet. We'll notify you if we find it." No silent failure.

---

## Performance Target

| Path | Target |
|---|---|
| Redis cache hit | < 100ms |
| Supabase table hit (no Redis) | < 500ms |
| Open Food Facts (first resolution) | < 2s |
| Gov DB fallback | < 3s |

Total scan-to-verdict: barcode decode (instant, on-device) + product resolution + constraint check + verdict build. Redis cache hit path achieves <1.5s total. External resolution path can reach 2.5–3s — acceptable, still under the 3s target.
