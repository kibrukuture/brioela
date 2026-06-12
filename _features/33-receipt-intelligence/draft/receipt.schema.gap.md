# Draft: receipt.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/receipt.schema.ts`

**Gap (feature 33):** Private Brain SQLite receipt header. Not yet in `06-brain-memory/01-sqlite-schema.md` — add via **04** migration.

**Source:** `brioela-specs/06-receipt-spend-intelligence.md`, `build-guide/13-receipt-intelligence/01-receipt-ingestion.md`

---

```typescript
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

export const receiptStatusValues = [
  'processing',
  'normalized',
  'unresolved',
  'failed',
] as const
export type ReceiptStatus = (typeof receiptStatusValues)[number]

export const receipts = sqliteTable('receipt', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  merchantName: text('merchant_name'),
  merchantNormalized: text('merchant_normalized'),
  placeId: text('place_id'),
  capturedAt: integer('captured_at').notNull(),
  subtotal: real('subtotal'),
  tax: real('tax'),
  total: real('total').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().$type<ReceiptStatus>(),
  imageObjectKey: text('image_object_key'),
  geoHash: text('geo_hash'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type ReceiptRow = typeof receipts.$inferSelect
export type InsertReceiptRow = typeof receipts.$inferInsert
```

Indexes: `(user_id, captured_at DESC)`, `(user_id, status)`.
