# Draft: dedupe.gap.candidates.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/dedupe.gap.candidates.helper.ts`

**Gap:** Step 5 — drop closed, contradicted, below-threshold candidates.

**Source:** `build-guide/37-negative-space-nutrition/02-detection-pass.md`

---

```typescript
import type { DietGapMemoryValue } from '@shared/validator/negative-space/diet.gaps.memory.schema'
import type { StructuralAbsenceCandidate } from './detect.structural.absences.helper'
import type { DisplacementGapCandidate } from './detect.displacement.gaps.helper'
import type { NutrientCategoryKey } from './nutrient.category.catalog'

export type GapCandidate = (StructuralAbsenceCandidate | DisplacementGapCandidate) & {
  category: NutrientCategoryKey
}

export function dedupeGapCandidates(input: {
  candidates: GapCandidate[]
  dietGapsMemory: Record<string, DietGapMemoryValue>
  contradictions: string[] // e.g. user_memory "takes fish oil" for omega_3
}): GapCandidate[] {
  const seen = new Set<NutrientCategoryKey>()

  return input.candidates
    .filter((c) => {
      const mem = input.dietGapsMemory[c.category]
      if (mem?.status === 'closed') return false
      if (input.contradictions.includes(c.category)) return false
      if (seen.has(c.category)) return false
      seen.add(c.category)
      return true
    })
    .sort((a, b) => b.confidence - a.confidence)
}
```

**Rule:** Closed gaps in `diet.gaps` never resurface — even if data still shows absence.
