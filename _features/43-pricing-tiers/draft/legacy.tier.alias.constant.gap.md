# Draft: legacy.tier.alias.constant.ts (gap — file does not exist)

Target: `shared/constants/tiers/legacy.tier.alias.constant.ts`

**Gap:** Spec **19** and neighbor features use Free/Core/Chef/Power strings; build guide uses Sapor/Luma/Culina/Viva (**C2**, **C6**).

**Source:** `build-guide/21-kids-mode/05-safety-and-tier-boundary.md`, `brioela-specs/19-pricing-and-tiers.md`

---

```typescript
import { BrioelaTier } from './tiers.constant'

const LEGACY_TO_BRIOELA: Record<string, BrioelaTier> = {
  free: BrioelaTier.SAPOR,
  sapor: BrioelaTier.SAPOR,
  core: BrioelaTier.LUMA,
  luma: BrioelaTier.LUMA,
  chef: BrioelaTier.CULINA,
  culina: BrioelaTier.CULINA,
  power: BrioelaTier.VIVA,
  viva: BrioelaTier.VIVA,
  b2b: BrioelaTier.SIGNET,
  signet: BrioelaTier.SIGNET,
}

export function normalizeLegacyTier(input: string): BrioelaTier {
  const key = input.toLowerCase()
  const mapped = LEGACY_TO_BRIOELA[key]
  if (!mapped) {
    throw new Error(`Unknown tier alias: ${input}`)
  }
  return mapped
}
```
