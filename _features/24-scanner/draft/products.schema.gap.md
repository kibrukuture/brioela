# Gap snapshot: products.schema.ts (Supabase)

Target: `shared/drizzle/schema/products.schema.ts`

**Status:** Not in repo. From `build-guide/07-scanner/02-product-resolution.md`.

---

```typescript
import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

export const products = brioela.table('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  upc: text('upc').notNull().unique(),
  name: text('name').notNull(),
  brand: text('brand'),
  ingredients: jsonb('ingredients'),
  nutrients: jsonb('nutrients'),
  originCountry: text('origin_country'),
  additives: jsonb('additives'),
  allergens: jsonb('allergens'),
  imageUrl: text('image_url'),
  source: text('source').notNull(),
  sourceRefs: jsonb('source_refs'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const productOrigin = brioela.table('product_origin', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  originCountry: text('origin_country'),
  manufacturingCountry: text('manufacturing_country'),
  parentCompany: text('parent_company'),
  parentCompanyId: text('parent_company_id'),
  sourceRefs: jsonb('source_refs'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
})

export type ProductRow = typeof products.$inferSelect
export type ProductOriginRow = typeof productOrigin.$inferSelect
```

**Cache:** Redis key `product:{upc}`, TTL 7 days.

**Hot path type:** `ResolvedProductFactSnapshot` — built from products + product_origin + product_fact_evidence (**06**).
