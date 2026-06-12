# Draft: check.craving.tier.gate.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/craving-decoder/check.craving.tier.gate.helper.ts`

**Gap:** No Core+ vs Free degradation for craving decode.

**Source:** `brioela-specs/52-craving-decoder.md` Tier Placement

---

```typescript
export type UserTier = 'free' | 'core' | 'chef' | 'family'

export type CravingTierGateResult = {
  allowed: boolean
  mode: 'full' | 'free_generic'
  upgradeSurface?: string
  genericCopy?: string
}

const FREE_GENERIC_COPY =
  "Cravings are complicated — sleep, stress, and how long it's been since you ate all play a part. A fuller read of your patterns is part of Core."

export function checkCravingTierGate(tier: UserTier): CravingTierGateResult {
  if (tier === 'free') {
    return {
      allowed: true,
      mode: 'free_generic',
      genericCopy: FREE_GENERIC_COPY,
      upgradeSurface: 'inline_core_memory',
    }
  }

  return { allowed: true, mode: 'full' }
}
```

**Rule:** Degrades by **data** when Core+ (no wearables → behavioral evidence only) — tier gate is separate from data availability.
