# Gap snapshot: contribute.shared.menu.intelligence.helper.ts

Target: `backend/src/api/menu-scans/_helpers/contribute.shared.menu.intelligence.helper.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/06-shared-menu-intelligence.md`.

```typescript
import type { ParsedMenu, MenuScanSourceSchema } from '@brioela/shared/validator/menu.scan'
import type { Env } from '@/types/env'
import { computeMenuFingerprint } from './compute.menu.fingerprint.helper'

type ContributeInput = {
  placeId: string | null | undefined
  parsedMenu: ParsedMenu
  source: z.infer<typeof MenuScanSourceSchema>
  resolvedUrl: string | null
}

const MIN_DISH_CONFIDENCE = 0.6
const MIN_PLACE_MATCH = 0.75

export async function contributeSharedMenuIntelligence(
  env: Env,
  input: ContributeInput,
): Promise<void> {
  if (!input.placeId) return

  const highConfidenceDishes = input.parsedMenu.dishes.filter(
    (d) => d.extractionConfidence >= MIN_DISH_CONFIDENCE,
  )
  if (highConfidenceDishes.length === 0) return

  // Place match confidence gate — stub until 28 place resolver ships
  const placeMatchConfidence = 0.8
  if (placeMatchConfidence < MIN_PLACE_MATCH) return

  const fingerprint = computeMenuFingerprint({
    placeId: input.placeId,
    resolvedUrl: input.resolvedUrl,
    normalizedDishNames: highConfidenceDishes.map((d) => d.name),
    normalizedSections: highConfidenceDishes.map((d) => d.section ?? ''),
    normalizedPriceTexts: highConfidenceDishes.map((d) => d.priceText ?? ''),
  })

  // Upsert restaurant_menu_source, restaurant_menu_version, restaurant_menu_dish
  // Never include userId, allergies, or personalized verdicts in payload
  void env
  void fingerprint
  void input.source
}
```

**Photo contributions:** More conservative than QR/URL per `06` validation rules.
