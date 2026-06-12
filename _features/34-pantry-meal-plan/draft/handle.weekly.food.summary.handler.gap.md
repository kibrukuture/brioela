# Draft: run.weekly.food.summary.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/run.weekly.food.summary.handler.ts`

**Gap (feature 34):** Weekly food summary generation body — **14** dispatches `weekly_food_summary` alarm type.

**Source:** `brioela-specs/16-weekly-food-summary.md`, `build-guide/14-pantry-meal-plan/06-weekly-food-summary.md`

---

```typescript
import { generateObject } from 'ai'
import { z } from 'zod'
import type { BrainSqlite } from '@/agents/brain/_types'

const WeeklySummaryGenerationSchema = z.object({
  oneLiner: z.string().min(1),
  observations: z.array(z.string()).min(2).max(4),
  action: z.string().optional(),
  shareableMoment: z.string().optional(),
})

type RunWeeklyFoodSummaryInput = {
  db: BrainSqlite
  userId: string
  weekStart: string
  now: number
}

export async function runWeeklyFoodSummaryAlarm(
  input: RunWeeklyFoodSummaryInput,
): Promise<{ summaryId: string }> {
  const signals = await aggregateWeeklyFoodSignals(input.db, input.userId, input.weekStart)

  const { object } = await generateObject({
    model: 'gpt-4o-mini',
    schema: WeeklySummaryGenerationSchema,
    prompt: buildWeeklySummaryPrompt(signals),
  })

  const summaryId = await insertWeeklySummary(input.db, {
    userId: input.userId,
    weekStart: input.weekStart,
    summaryJson: JSON.stringify(object),
    generatedAt: input.now,
  })

  await enqueueWeeklyFoodSummaryPush(input.userId, object.oneLiner)

  return { summaryId }
}

async function aggregateWeeklyFoodSignals(
  db: BrainSqlite,
  userId: string,
  weekStart: string,
) {
  // Sources: scans (**24**), receipts (**33**), recipes (**08**), constraints, sessions (**29**)
  void db
  void userId
  void weekStart
  return {}
}

function buildWeeklySummaryPrompt(signals: unknown): string {
  return `Generate a concise weekly food summary. Avoid overconfident causal claims. Signals: ${JSON.stringify(signals)}`
}

async function insertWeeklySummary(
  db: BrainSqlite,
  row: {
    userId: string
    weekStart: string
    summaryJson: string
    generatedAt: number
  },
): Promise<string> {
  void db
  void row
  return crypto.randomUUID()
}

async function enqueueWeeklyFoodSummaryPush(
  userId: string,
  oneLiner: string,
): Promise<void> {
  // **21** type: weekly_food_summary — medium, Sunday AM local
  void userId
  void oneLiner
}
```

**Boundary:** Retrospective digest only — does not write inventory or meal plan rows.
