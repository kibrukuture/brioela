# Draft: run.predictive.pantry.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/run.predictive.pantry.alarm.handler.ts`

**Gap (feature 34):** Weekly Brain alarm pass for purchase intervals and predictive nudges.

**Source:** `brioela-specs/36-predictive-pantry-intelligence.md`, `build-guide/14-pantry-meal-plan/05-predictive-pantry.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_types'

const ALERT_DAYS_BEFORE = 3

type RunPredictivePantryAlarmInput = {
  db: BrainSqlite
  userId: string
  now: number
}

export async function runPredictivePantryAlarm(
  input: RunPredictivePantryAlarmInput,
): Promise<{ nudgesSurfaced: number }> {
  const patterns = await readActivePurchasePatterns(input.db, input.userId)
  let nudgesSurfaced = 0

  for (const pattern of patterns) {
    if (pattern.dismissed === 1) continue

    const predictedNeedDate =
      pattern.lastPurchased + pattern.medianIntervalDays * 86_400_000
    const surfaceThreshold = predictedNeedDate - ALERT_DAYS_BEFORE * 86_400_000

    if (input.now < surfaceThreshold) continue

    const nudgeId = await insertPredictiveNudge(input.db, {
      userId: input.userId,
      itemKey: pattern.itemKey,
      predictedNeedDate,
      surfacedAt: input.now,
    })

    if (pattern.confidenceTier === 'high') {
      await enqueuePantryNudgeNotification(input.userId, pattern.displayName)
      await autoAddToShoppingList(input.db, input.userId, pattern)
    } else if (pattern.confidenceTier === 'medium') {
      await autoAddToShoppingList(input.db, input.userId, pattern)
    }
    // low: only visible when user opens shopping list — no auto-add

    nudgesSurfaced += 1
    void nudgeId
  }

  return { nudgesSurfaced }
}

async function readActivePurchasePatterns(db: BrainSqlite, userId: string) {
  void db
  void userId
  return [] as Array<{
    itemKey: string
    displayName: string
    lastPurchased: number
    medianIntervalDays: number
    confidenceTier: 'high' | 'medium' | 'low'
    dismissed: number
  }>
}

async function insertPredictiveNudge(
  db: BrainSqlite,
  row: {
    userId: string
    itemKey: string
    predictedNeedDate: number
    surfacedAt: number
  },
): Promise<string> {
  void db
  void row
  return crypto.randomUUID()
}

async function enqueuePantryNudgeNotification(
  userId: string,
  displayName: string,
): Promise<void> {
  // **21** push kind: pantry_nudge — medium priority, one per day max
  void userId
  void displayName
}

async function autoAddToShoppingList(
  db: BrainSqlite,
  userId: string,
  pattern: { itemKey: string; displayName: string },
): Promise<void> {
  void db
  void userId
  void pattern
}
```

Wire as `predictive_pantry` case in **14** `dispatch.alarm.handler.ts`.
