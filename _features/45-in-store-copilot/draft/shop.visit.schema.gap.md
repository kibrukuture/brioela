# Draft: shop.visit.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/shop.visit.schema.ts`

**Gap:** No `shop_visit` Brain SQLite table per spec 45.

**Source:** `brioela-specs/45-in-store-copilot.md`, `build-guide/32-in-store-copilot/01-session-lifecycle.md`

---

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const shopVisitListSourceEnum = [
  'plan',
  'pantry',
  'dictated',
  'mixed',
] as const

export type ShopVisitListSource = (typeof shopVisitListSourceEnum)[number]

export const shopVisit = sqliteTable('shop_visit', {
  visitId: text('visit_id').primaryKey(),
  userId: text('user_id').notNull(),
  placeId: text('place_id').notNull(),
  miraSessionId: text('mira_session_id'),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  listSource: text('list_source', { enum: shopVisitListSourceEnum }).notNull(),
  itemsListed: integer('items_listed').notNull().default(0),
  itemsScanned: integer('items_scanned').notNull().default(0),
  itemsBoughtEstimate: integer('items_bought_estimate').notNull().default(0),
  spendEstimate: real('spend_estimate'),
  receiptId: text('receipt_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export type ShopVisitRow = typeof shopVisit.$inferSelect
export type InsertShopVisitRow = typeof shopVisit.$inferInsert
```
