# Draft: receipt.line.item.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/receipt.line.item.schema.ts`

**Source:** `brioela-specs/06-receipt-spend-intelligence.md`, `build-guide/13-receipt-intelligence/03-line-item-product-matching.md`

---

```typescript
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'
import { receipts } from './receipt.schema'

export const lineItemResolutionValues = [
  'matched_product',
  'matched_category',
  'unresolved',
] as const
export type LineItemResolution = (typeof lineItemResolutionValues)[number]

export const receiptLineItems = sqliteTable('receipt_line_item', {
  id: text('id').primaryKey(),
  receiptId: text('receipt_id')
    .notNull()
    .references(() => receipts.id, { onDelete: 'cascade' }),
  lineIndex: integer('line_index').notNull(),
  rawLabel: text('raw_label').notNull(),
  normalizedLabel: text('normalized_label'),
  quantity: real('quantity'),
  unitPrice: real('unit_price'),
  lineTotal: real('line_total'),
  matchedProductId: text('matched_product_id'),
  matchedCategoryId: text('matched_category_id'),
  matchConfidence: real('match_confidence'),
  resolution: text('resolution').notNull().$type<LineItemResolution>(),
  upc: text('upc'),
  merchantSku: text('merchant_sku'),
  createdAt: integer('created_at').notNull(),
})

export type ReceiptLineItemRow = typeof receiptLineItems.$inferSelect
```

Indexes: `(receipt_id, line_index)`, `(matched_product_id, created_at DESC)`.
