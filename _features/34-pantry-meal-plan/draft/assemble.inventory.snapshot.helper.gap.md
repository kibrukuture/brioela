# Draft: assemble.inventory.snapshot.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/assemble.inventory.snapshot.helper.ts`

**Gap (feature 34):** Core probabilistic inventory model — used by meal plan, rescue, Bela gap check.

**Source:** `implementable-specs/bela/10-cooking-intent-trigger.md`, `brioela-specs/33-minimum-spend-meal-plan.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_types'

export type InventorySnapshotItem = {
  itemKey: string
  displayName: string
  probabilityInStock: number
  lastSeenAt: number | null
  expiresRiskScore: number
  sources: {
    scan: number
    receipt: number
    cooking: number
    snapshot: number
  }
}

export type InventorySnapshot = {
  userId: string
  assembledAt: number
  items: InventorySnapshotItem[]
  wasteRiskItems: InventorySnapshotItem[]
}

type AssembleInventorySnapshotInput = {
  db: BrainSqlite
  userId: string
}

export async function assembleInventorySnapshot(
  input: AssembleInventorySnapshotInput,
): Promise<InventorySnapshot> {
  const { db, userId } = input
  const assembledAt = Date.now()

  const rows = await db.query.inventoryItemEstimates.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    orderBy: (t, { desc }) => [desc(t.expiresRiskScore)],
  })

  const items: InventorySnapshotItem[] = rows.map((row) => ({
    itemKey: row.itemKey,
    displayName: row.displayName,
    probabilityInStock: row.probabilityInStock,
    lastSeenAt: row.lastSeenAt,
    expiresRiskScore: row.expiresRiskScore,
    sources: JSON.parse(row.sourceMixJson) as InventorySnapshotItem['sources'],
  }))

  const wasteRiskItems = items
    .filter((i) => i.expiresRiskScore >= 0.5)
    .sort((a, b) => b.expiresRiskScore - a.expiresRiskScore)

  return { userId, assembledAt, items, wasteRiskItems }
}

export function isPantryGapItem(item: InventorySnapshotItem): boolean {
  return item.probabilityInStock < 0.4
}
```

Blocked: `inventory_item_estimate` table (G3), scan/receipt/cooking signal writers.
