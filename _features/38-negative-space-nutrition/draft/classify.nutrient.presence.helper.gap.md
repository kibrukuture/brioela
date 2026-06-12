# Draft: classify.nutrient.presence.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/classify.nutrient.presence.helper.ts`

**Gap:** No corpus → v1 category carrier mapping for presence map.

**Source:** `brioela-specs/50-negative-space-nutrition.md` Tracked Categories, **24** product nutrients

---

```typescript
import type { NutrientCategoryKey } from './nutrient.category.catalog'

export type ObservedFoodItem = {
  itemId: string
  source: 'scan' | 'receipt' | 'cooked' | 'meal_log'
  productId: string | null
  nutrients: Record<string, number> | null
  tags: string[]
  observedAt: number
}

export type CategoryHit = {
  category: NutrientCategoryKey
  carrierLabel: string
}

export function classifyItemToCategories(item: ObservedFoodItem): CategoryHit[] {
  if (!item.nutrients && item.tags.length === 0) {
    return []
  }

  const hits: CategoryHit[] = []

  // omega_3: fatty fish tags or EPA/DHA nutrients
  if (item.tags.includes('fatty_fish') || hasNutrient(item, 'omega_3_mg', 250)) {
    hits.push({ category: 'omega_3', carrierLabel: item.tags[0] ?? 'seafood' })
  }

  // calcium, fiber_density, fresh_produce, iron, protein_variety — catalog rules
  void hits
  return hits
}

function hasNutrient(item: ObservedFoodItem, key: string, min: number): boolean {
  const v = item.nutrients?.[key]
  return typeof v === 'number' && v >= min
}

export function isUnclassifiable(item: ObservedFoodItem): boolean {
  return item.nutrients === null && item.tags.length === 0
}
```

**24 consumer:** Reads Supabase `products.nutrients` — does not own corpus ingest.
