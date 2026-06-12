# Gap snapshot: scan.schema.ts (Supabase)

Target: `shared/drizzle/schema/scan.schema.ts`

**Status:** Not in repo. From `build-guide/07-scanner/01-barcode-decode.md`.

---

```typescript
import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

export const scanEvents = brioela.table('scan_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  upc: text('upc').notNull(),
  productId: text('product_id'),
  rawScanType: text('raw_scan_type').notNull(),
  verdict: text('verdict'),
  geoHash: text('geo_hash'),
  status: text('status').notNull().default('pending'),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ScanEvent = typeof scanEvents.$inferSelect
export type NewScanEvent = typeof scanEvents.$inferInsert
```

**Why Supabase:** **31** recall matching requires cross-user query — impossible in per-user Brain SQLite alone.

**Write order:** Insert `pending` before resolution; update `product_id` + `verdict` + `resolved` on success.
