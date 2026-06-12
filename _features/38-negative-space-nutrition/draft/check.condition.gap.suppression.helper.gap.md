# Draft: check.condition.gap.suppression.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/check.condition.gap.suppression.helper.ts`

**Gap:** Condition handoff — suppress gap candidates touching active medical watchlists (**23**/**28**).

**Source:** `build-guide/37-negative-space-nutrition/02-detection-pass.md`, `brioela-specs/28-medical-condition-food-profile.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import type { GapCandidate } from './dedupe.gap.candidates.helper'
import type { NutrientCategoryKey } from './nutrient.category.catalog'

/** Categories suppressed when user has CKD — potassium is spec 28 territory, not 38 */
const CONDITION_CATEGORY_SUPPRESSION: Record<string, NutrientCategoryKey[]> = {
  chronic_kidney_disease: [], // extend: any potassium-focused gap keys when added
  warfarin: [],
}

export async function checkConditionGapSuppression(
  db: BrainSqlite,
  userId: string,
  candidates: GapCandidate[],
): Promise<GapCandidate[]> {
  const activeConditions = await loadActiveMedicalConditions(db, userId)
  const suppressed = new Set<NutrientCategoryKey>()

  for (const condition of activeConditions) {
    const cats = CONDITION_CATEGORY_SUPPRESSION[condition] ?? []
    for (const c of cats) suppressed.add(c)
  }

  return candidates.filter((c) => !suppressed.has(c.category))
}

async function loadActiveMedicalConditions(
  db: BrainSqlite,
  userId: string,
): Promise<string[]> {
  void db
  void userId
  return []
}
```

**Rule:** Condition-sensitive nutrients are **suppressed entirely** here — spec **28** owns that territory.
