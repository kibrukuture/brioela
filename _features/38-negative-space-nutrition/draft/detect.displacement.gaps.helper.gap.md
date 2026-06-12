# Draft: detect.displacement.gaps.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/detect.displacement.gaps.helper.ts`

**Gap:** Step 4 — nutrients lost when dietary change removed carrier. At most one LLM call per pass.

**Source:** `brioela-specs/50-negative-space-nutrition.md` Detection Pass step 4

---

```typescript
import { generateObject } from 'ai'
import { z } from 'zod'
import type { PresenceMap } from './build.presence.map.helper'
import type { NutrientCategoryKey } from './nutrient.category.catalog'

export type DietMemoryChange = {
  namespace: string
  key: string
  value: unknown
  writtenAt: number
}

const DisplacementResultSchema = z.object({
  gaps: z.array(
    z.object({
      category: z.string(),
      displacedSource: z.string(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    }),
  ),
})

export type DisplacementGapCandidate = {
  category: NutrientCategoryKey
  gapClass: 'displacement'
  confidence: number
  evidence: {
    displacedSource: string
    dietMemoryRefs: string[]
    reasoning: string
  }
}

export async function detectDisplacementGaps(input: {
  presenceMap: PresenceMap
  dietTimeline: DietMemoryChange[]
  driftPatternIds: string[]
}): Promise<DisplacementGapCandidate[]> {
  if (input.dietTimeline.length === 0) {
    return []
  }

  const { object } = await generateObject({
    model: 'gpt-4o-mini',
    schema: DisplacementResultSchema,
    prompt: buildDisplacementPrompt(input),
  })

  return object.gaps
    .filter((g) => g.confidence >= 0.7)
    .map((g) => ({
      category: g.category as NutrientCategoryKey,
      gapClass: 'displacement' as const,
      confidence: g.confidence,
      evidence: {
        displacedSource: g.displacedSource,
        dietMemoryRefs: input.dietTimeline.map((d) => `${d.namespace}:${d.key}`),
        reasoning: g.reasoning,
      },
    }))
}

function buildDisplacementPrompt(input: {
  presenceMap: PresenceMap
  dietTimeline: DietMemoryChange[]
  driftPatternIds: string[]
}): string {
  return JSON.stringify({
    task: 'Identify nutrient categories whose carriers were removed by diet changes without replacement',
    presenceMap: input.presenceMap,
    dietChanges: input.dietTimeline,
    driftPatterns: input.driftPatternIds,
  })
}
```

**37 vs 38:** Displacement uses `diet.*` timeline — not craving recency.
