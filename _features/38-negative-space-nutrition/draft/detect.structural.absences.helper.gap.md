# Draft: detect.structural.absences.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/detect.structural.absences.helper.ts`

**Gap:** Step 3 of six-step pass — near-zero category presence.

**Source:** `build-guide/37-negative-space-nutrition/02-detection-pass.md`

---

```typescript
import type { PresenceMap } from './build.presence.map.helper'
import type { NutrientCategoryKey } from './nutrient.category.catalog'
import { NUTRIENT_CATEGORY_KEYS } from './nutrient.category.catalog'

const NEAR_ZERO_CARRIER_THRESHOLD = 1
const MIN_CONFIDENCE = 0.65

export type StructuralAbsenceCandidate = {
  category: NutrientCategoryKey
  gapClass: 'structural'
  carrierCount: number
  confidence: number
  evidence: {
    windowCarrierCount: number
    lastSeenAt: number | null
  }
}

export function detectStructuralAbsences(
  presenceMap: PresenceMap,
  qualifyingWeeks: number,
): StructuralAbsenceCandidate[] {
  if (qualifyingWeeks < 6) {
    return []
  }

  const candidates: StructuralAbsenceCandidate[] = []

  for (const category of NUTRIENT_CATEGORY_KEYS) {
    const entry = presenceMap[category]
    const count = entry?.carrierCount ?? 0
    if (count <= NEAR_ZERO_CARRIER_THRESHOLD) {
      candidates.push({
        category,
        gapClass: 'structural',
        carrierCount: count,
        confidence: computeStructuralConfidence(count, qualifyingWeeks),
        evidence: {
          windowCarrierCount: count,
          lastSeenAt: entry?.lastSeenAt ?? null,
        },
      })
    }
  }

  return candidates.filter((c) => c.confidence >= MIN_CONFIDENCE)
}

function computeStructuralConfidence(carrierCount: number, weeks: number): number {
  const absenceStrength = carrierCount === 0 ? 1 : 0.75
  const windowStrength = Math.min(1, weeks / 8)
  return absenceStrength * 0.7 + windowStrength * 0.3
}
```
