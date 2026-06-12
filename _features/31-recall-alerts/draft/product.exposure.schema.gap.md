# Gap snapshot: product.exposure.schema.ts

Target: `shared/drizzle/schema/product.exposure.schema.ts`

**Status:** Not in repo. From `build-guide/15-recall-alerts/00-overview.md` Product Exposure Ledger.

**MVP:** Table can ship before writers; **24** `scan_events` remains primary match path until **33**/**34**/**42** emit rows.

---

```typescript
import { index, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

export const exposureSourceEnum = [
  'barcode_scan',
  'receipt_line',
  'bela_checkout',
  'pantry_confirm',
  'manual_log',
] as const
export type ExposureSource = (typeof exposureSourceEnum)[number]

export const productExposures = brioela.table(
  'product_exposure',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    productId: text('product_id'),
    upc: text('upc'),
    lotNumber: text('lot_number'),
    source: text('source').notNull(),
    sourceRefId: text('source_ref_id'),
    matchConfidence: integer('match_confidence'),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_exposure_upc_idx').on(table.upc),
    index('product_exposure_product_id_idx').on(table.productId),
    index('product_exposure_user_captured_idx').on(table.userId, table.capturedAt),
  ],
)

export type ProductExposure = typeof productExposures.$inferSelect
export type NewProductExposure = typeof productExposures.$inferInsert
```

**Writer ownership:**

| `source` | Feature |
|---|---|
| `barcode_scan` | **24** — mirror or dual-write from `scan_events` |
| `receipt_line` | **33** |
| `bela_checkout` | **42** |
| `pantry_confirm` | **34** |
| `manual_log` | Brain / future API |

**31** reads both `scan_events` (MVP) and `product_exposure` (unified) in match worker.
