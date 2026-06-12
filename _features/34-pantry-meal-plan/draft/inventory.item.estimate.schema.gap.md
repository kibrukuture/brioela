# Draft: inventory.item.estimate.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/inventory.item.estimate.schema.ts`

**Gap (feature 34):** Rolling probabilistic inventory — not real-time stock. Required by `assembleInventorySnapshot`, meal plan, and Bela `loadPantryModel()`.

**Source:** `implementable-specs/bela/10-cooking-intent-trigger.md`, `brioela-specs/33-minimum-spend-meal-plan.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const inventoryItemEstimates = sqliteTable('inventory_item_estimate', {
  itemKey: text('item_key').primaryKey(),
  userId: text('user_id').notNull(),
  displayName: text('display_name').notNull(),
  probabilityInStock: real('probability_in_stock').notNull(),
  lastSeenAt: integer('last_seen_at'),
  expiresRiskScore: real('expires_risk_score').notNull().default(0),
  sourceMixJson: text('source_mix_json').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type InventoryItemEstimateRow = typeof inventoryItemEstimates.$inferSelect
export type InsertInventoryItemEstimateRow = typeof inventoryItemEstimates.$inferInsert
```

`source_mix_json` tracks contributing signals: `{ scan: number, receipt: number, cooking: number, snapshot: number }`.

Gap threshold for Bela: `probability_in_stock < 0.4`.

Indexes: `(user_id, expires_risk_score DESC)`, `(user_id, last_seen_at DESC)`.
