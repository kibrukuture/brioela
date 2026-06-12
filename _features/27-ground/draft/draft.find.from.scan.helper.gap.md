# Gap snapshot: draft.find.from.scan.helper.ts

Target: `backend/src/api/finds/_helpers/draft.find.from.scan.helper.ts`

**Status:** Not in repo. From `build-guide/09-ground/03-find-submission-flow.md`, 35b Angle 2.

```typescript
import type { FindDraftFromScan, FindSignalType } from '@brioela/shared/validator/find'
import { FindDraftFromScanSchema } from '@brioela/shared/validator/find'

type ScanDraftInput = {
  productName: string
  brandName: string | null
  locationId: string
  locationName: string
  verdictLevel: 'green' | 'yellow'
  verdictReason: string
  isNewAtLocation: boolean
  priceChangePercent: number | null
  flaggedAdditives: string[]
}

export function draftFindFromScan(input: ScanDraftInput): FindDraftFromScan | null {
  if (!input.locationId) return null

  const draftId = crypto.randomUUID()
  let content: string
  let signalType: FindSignalType

  if (input.isNewAtLocation) {
    signalType = 'new_product'
    content = `Haven't seen ${input.productName} here before — ${input.locationName}.`
  } else if (input.priceChangePercent !== null && Math.abs(input.priceChangePercent) >= 5) {
    signalType = 'price'
    const direction = input.priceChangePercent < 0 ? 'dropped' : 'increased'
    content = `${input.productName} price ${direction} at ${input.locationName}.`
  } else if (input.verdictLevel === 'yellow' && input.flaggedAdditives.length > 0) {
    signalType = 'health'
    content = `${input.productName} at ${input.locationName} — ${input.flaggedAdditives.slice(0, 3).join(', ')} flagged.`
  } else if (input.verdictLevel === 'green') {
    signalType = 'ingredient'
    content = `${input.productName} — clean label at ${input.locationName}.`
  } else {
    return null
  }

  return FindDraftFromScanSchema.parse({
    draftId,
    content: content.slice(0, 280),
    signalType,
    locationId: input.locationId,
    locationName: input.locationName,
    productName: input.productName,
    scanVerdictLevel: input.verdictLevel,
  })
}
```

**Rules:** no opinions, no promotional language, no unsupported claims. Draft still passes full gate on Submit.

Called from scan resolve handler (**24**) when `locationId` known and verdict is green/yellow.
