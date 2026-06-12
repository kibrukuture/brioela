# Draft: tiers.constant.ts (gap — file does not exist)

Target: `shared/constants/tiers/tiers.constant.ts`

**Gap:** No shared tier enum, price display constants, or tier ordering for `checkTierAccess`.

**Source:** `build-guide/25-pricing-tiers/01-tier-names-and-copy.md`, `04-access-checks-and-tools.md`

---

```typescript
export const BrioelaTier = {
  SAPOR: 'sapor',
  LUMA: 'luma',
  CULINA: 'culina',
  VIVA: 'viva',
  SIGNET: 'signet',
} as const

export type BrioelaTier = (typeof BrioelaTier)[keyof typeof BrioelaTier]

export const BrioelaAddon = {
  MESA: 'mesa',
  SESSION_CREDITS: 'session_credits',
  BELA_SERVICE: 'bela_service',
} as const

export type BrioelaAddon = (typeof BrioelaAddon)[keyof typeof BrioelaAddon]

/** Ascending privilege — used for minimum-tier comparisons */
export const TIER_ORDER: readonly BrioelaTier[] = [
  BrioelaTier.SAPOR,
  BrioelaTier.LUMA,
  BrioelaTier.CULINA,
  BrioelaTier.VIVA,
  BrioelaTier.SIGNET,
]

export const TIER_DISPLAY_PRICE_USD: Record<BrioelaTier, string> = {
  [BrioelaTier.SAPOR]: '$0',
  [BrioelaTier.LUMA]: '$8/month',
  [BrioelaTier.CULINA]: '$24/month',
  [BrioelaTier.VIVA]: '$55/month',
  [BrioelaTier.SIGNET]: 'from $99/month',
}

export const MESA_ADDON_PRICE_USD = '+$8/month'
export const MESA_ACTIVE_MEMBER_LIMIT = 8
export const SAPOR_RECIPE_SAVE_LIMIT = 3
export const CULINA_VOICE_SESSIONS_PER_MONTH = 30
export const CULINA_VOICE_SESSION_MAX_MINUTES = 15

export function tierRank(tier: BrioelaTier): number {
  return TIER_ORDER.indexOf(tier)
}

export function tierAtLeast(current: BrioelaTier, minimum: BrioelaTier): boolean {
  return tierRank(current) >= tierRank(minimum)
}
```
