# Draft: pantry.item.detection.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/pantry.item.detection.schema.ts`

**Gap (feature 34):** Per-snapshot ingredient detections from vision. Confidence hidden from primary UX (spec 14).

**Source:** `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const pantryItemDetections = sqliteTable('pantry_item_detection', {
  id: text('id').primaryKey(),
  snapshotId: text('snapshot_id').notNull(),
  itemLabel: text('item_label').notNull(),
  confidence: real('confidence').notNull(),
  quantityEstimate: text('quantity_estimate'),
  matchedProductId: text('matched_product_id'),
  createdAt: integer('created_at').notNull(),
})

export type PantryItemDetectionRow = typeof pantryItemDetections.$inferSelect
export type InsertPantryItemDetectionRow = typeof pantryItemDetections.$inferInsert
```

Indexes: `(snapshot_id)`, `(snapshot_id, confidence DESC)`.
