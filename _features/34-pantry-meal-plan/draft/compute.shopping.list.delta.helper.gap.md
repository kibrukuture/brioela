# Draft: compute.shopping.list.delta.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/compute.shopping.list.delta.helper.ts`

**Gap (feature 34):** Plan ingredients minus inventory estimate → shopping list rows.

**Source:** `build-guide/14-pantry-meal-plan/04-shopping-list-and-cost.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_types'
import type { InventorySnapshot } from './assemble.inventory.snapshot.helper'

const DEPARTMENT_ORDER = [
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'other',
] as const

type SlotIngredient = {
  name: string
  status: 'at_home' | 'to_buy'
}

type ComputeShoppingListDeltaInput = {
  db: BrainSqlite
  planId: string
  slots: Array<{ ingredientStatus: SlotIngredient[] }>
  inventory: InventorySnapshot
}

export async function computeShoppingListDelta(
  input: ComputeShoppingListDeltaInput,
): Promise<void> {
  const aggregated = aggregateIngredients(input.slots)
  const rows = aggregated.map((ing) => {
    const inStock = resolveInStock(ing.name, input.inventory)
    return {
      planId: input.planId,
      ingredientName: ing.name,
      status: inStock ? ('already_have' as const) : ('to_buy' as const),
      department: classifyDepartment(ing.name),
      source: 'plan' as const,
    }
  })

  rows.sort(
    (a, b) =>
      DEPARTMENT_ORDER.indexOf(a.department as (typeof DEPARTMENT_ORDER)[number]) -
      DEPARTMENT_ORDER.indexOf(b.department as (typeof DEPARTMENT_ORDER)[number]),
  )

  await replaceShoppingListRows(input.db, input.planId, rows)
}

function aggregateIngredients(
  slots: ComputeShoppingListDeltaInput['slots'],
): Array<{ name: string }> {
  const seen = new Map<string, true>()
  for (const slot of slots) {
    for (const ing of slot.ingredientStatus) {
      if (ing.status === 'to_buy') seen.set(ing.name.toLowerCase(), true)
    }
  }
  return [...seen.keys()].map((name) => ({ name }))
}

function resolveInStock(name: string, inventory: InventorySnapshot): boolean {
  const item = inventory.items.find(
    (i) => i.displayName.toLowerCase() === name.toLowerCase(),
  )
  return item !== undefined && item.probabilityInStock >= 0.5
}

function classifyDepartment(name: string): string {
  void name
  return 'other'
}

async function replaceShoppingListRows(
  db: BrainSqlite,
  planId: string,
  rows: Array<{
    planId: string
    ingredientName: string
    status: 'to_buy' | 'already_have'
    department: string
    source: 'plan'
  }>,
): Promise<void> {
  void db
  void planId
  void rows
}
```
