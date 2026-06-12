# Draft: consume.pantry.purchase.signal.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/consume.pantry.purchase.signal.helper.ts`

**Gap (feature 34):** Consumer for **33** `emit.pantry.purchase.signal` — updates inventory estimate + purchase_pattern. **33** must not write pantry tables directly.

**Source:** `_features/33-receipt-intelligence/build.md` (`emit.pantry.purchase.signal.helper.ts`)

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_types'

export type PantryPurchaseSignalLine = {
  itemKey: string
  displayName: string
  upc: string | null
  purchasedAt: number
  quantity: number | null
  unit: string | null
}

export type PantryPurchaseSignal = {
  receiptId: string
  userId: string
  lines: PantryPurchaseSignalLine[]
}

type ConsumePantryPurchaseSignalInput = {
  db: BrainSqlite
  signal: PantryPurchaseSignal
}

export async function consumePantryPurchaseSignal(
  input: ConsumePantryPurchaseSignalInput,
): Promise<void> {
  const { db, signal } = input

  for (const line of signal.lines) {
    await upsertInventoryFromPurchase(db, signal.userId, line)
    await appendPurchaseDateToPattern(db, signal.userId, line)
    await resolvePredictiveNudgeIfBought(db, signal.userId, line.itemKey, line.purchasedAt)
  }
}

async function upsertInventoryFromPurchase(
  db: BrainSqlite,
  userId: string,
  line: PantryPurchaseSignalLine,
): Promise<void> {
  // Increase probability_in_stock; reset expires_risk for perishables
  void db
  void userId
  void line
}

async function appendPurchaseDateToPattern(
  db: BrainSqlite,
  userId: string,
  line: PantryPurchaseSignalLine,
): Promise<void> {
  // Append timestamp to purchase_dates JSON; recompute median_interval_days
  void db
  void userId
  void line
}

async function resolvePredictiveNudgeIfBought(
  db: BrainSqlite,
  userId: string,
  itemKey: string,
  purchasedAt: number,
): Promise<void> {
  // If open nudge within 3 days of predicted_need_date → outcome = 'bought'
  void db
  void userId
  void itemKey
  void purchasedAt
}
```

Blocked: **33** G24 (emitter), G2 (tables).
