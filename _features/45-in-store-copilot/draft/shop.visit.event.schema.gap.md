# Draft: shop.visit.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/shop.visit.event.schema.ts`

**Gap:** No `shop_visit_event` append-only event log.

**Source:** `brioela-specs/45-in-store-copilot.md`

---

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const shopVisitEventTypeEnum = [
  'scan',
  'swap_suggested',
  'swap_taken',
  'constraint_warning',
  'ground_find_relayed',
  'total_milestone',
] as const

export type ShopVisitEventType = (typeof shopVisitEventTypeEnum)[number]

export const shopVisitEvent = sqliteTable('shop_visit_event', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  visitId: text('visit_id').notNull(),
  eventType: text('event_type', { enum: shopVisitEventTypeEnum }).notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: text('created_at').notNull(),
})

export type ShopVisitEventRow = typeof shopVisitEvent.$inferSelect
export type InsertShopVisitEventRow = typeof shopVisitEvent.$inferInsert
```
