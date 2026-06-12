# Draft: purchase.price.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/purchase.price.event.schema.ts`

**Gap (feature 33):** Private price history — Brain DO SQLite only. Spec 29 `purchase_price_event`.

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`, `build-guide/13-receipt-intelligence/05-price-history-and-alerts.md`

---

```typescript
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

export const purchasePriceEvents = sqliteTable('purchase_price_event', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  upc: text('upc'),
  productId: text('product_id'),
  productName: text('product_name').notNull(),
  price: real('price').notNull(),
  currency: text('currency').notNull().default('USD'),
  storeName: text('store_name'),
  storeLocation: text('store_location'),
  placeId: text('place_id'),
  purchaseDate: integer('purchase_date').notNull(),
  receiptId: text('receipt_id').notNull(),
  receiptLineItemId: text('receipt_line_item_id'),
  createdAt: integer('created_at').notNull(),
})

export type PurchasePriceEventRow = typeof purchasePriceEvents.$inferSelect
```

Indexes: `(user_id, product_id, purchase_date DESC)`, `(user_id, upc, store_name, purchase_date DESC)`.

**Boundary:** Never replicate this table to Supabase. Shared geography prices → **28** `price_sighting`.
