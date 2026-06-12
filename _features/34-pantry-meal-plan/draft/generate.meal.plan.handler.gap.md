# Draft: generate.meal.plan.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/generate.meal.plan.handler.ts`

**Gap (feature 34):** Single structured LLM call for 7-day plan — <5s, Brain SQLite context only.

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`, `build-guide/14-pantry-meal-plan/03-meal-plan-generation.md`

---

```typescript
import { generateObject } from 'ai'
import { z } from 'zod'
import type { BrainSqlite } from '@/agents/brain/_types'
import { assembleInventorySnapshot } from './assemble.inventory.snapshot.helper'
import { computeShoppingListDelta } from './compute.shopping.list.delta.helper'

const MealPlanGenerationSchema = z.object({
  slots: z.array(
    z.object({
      dayIndex: z.number().int().min(1).max(7),
      mealType: z.enum(['breakfast', 'lunch', 'dinner']),
      recipeId: z.string().uuid(),
      ingredientStatus: z.array(
        z.object({
          name: z.string(),
          status: z.enum(['at_home', 'to_buy']),
        }),
      ),
    }),
  ),
})

type GenerateMealPlanInput = {
  db: BrainSqlite
  userId: string
  weekStartDate: string
  preferExistingInventory: boolean
  previewDays?: number
}

export async function generateMealPlan(input: GenerateMealPlanInput) {
  const inventory = await assembleInventorySnapshot({ db: input.db, userId: input.userId })
  const recipePool = await loadConstraintSafeRecipePool(input.db, input.userId)
  const constraints = await loadActiveConstraints(input.db, input.userId)

  const { object } = await generateObject({
    model: 'gpt-4o-mini',
    schema: MealPlanGenerationSchema,
    prompt: buildMealPlanPrompt({
      inventory,
      recipePool,
      constraints,
      weekStartDate: input.weekStartDate,
      preferExistingInventory: input.preferExistingInventory,
      previewDays: input.previewDays ?? 7,
    }),
  })

  const planId = await persistMealPlan(input.db, input.userId, input.weekStartDate, object.slots)
  await computeShoppingListDelta({
    db: input.db,
    planId,
    slots: object.slots,
    inventory,
  })

  return { planId }
}

async function loadConstraintSafeRecipePool(db: BrainSqlite, userId: string) {
  void db
  void userId
  return []
}

async function loadActiveConstraints(db: BrainSqlite, userId: string) {
  void db
  void userId
  return []
}

function buildMealPlanPrompt(_ctx: unknown): string {
  return ''
}

async function persistMealPlan(
  db: BrainSqlite,
  userId: string,
  weekStartDate: string,
  slots: z.infer<typeof MealPlanGenerationSchema>['slots'],
) {
  void db
  void userId
  void weekStartDate
  void slots
  return crypto.randomUUID()
}
```

Blocked: **08** recipe pool (G24), **07** constraints (partial OK).
