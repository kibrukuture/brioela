# Draft: tier.entitlement.matrix.constant.ts (gap — file does not exist)

Target: `shared/constants/tiers/tier.entitlement.matrix.constant.ts`

**Gap:** Master entitlement matrix exists only in `_features/43-pricing-tiers/spec.md` — not executable.

**Source:** `spec.md` master table; `build-guide/25-pricing-tiers/02-tier-entitlements.md`

---

```typescript
import { BrioelaAddon, BrioelaTier } from './tiers.constant'

export type FeatureAction =
  | 'recipe_import_unlimited'
  | 'receipt_scan'
  | 'receipt_price_history'
  | 'menu_scan'
  | 'map_full'
  | 'map_geo_alerts'
  | 'community_notes_write'
  | 'ground_find_author'
  | 'kids_mode'
  | 'weekly_food_summary'
  | 'meal_plan_full_week'
  | 'meal_plan_preview'
  | 'pantry_rescue'
  | 'voice_cooking_session'
  | 'live_video_cooking'
  | 'multi_person_room'
  | 'advanced_behavior_reports'
  | 'mesa_audience'
  | 'verified_profile'
  | 'verified_business'
  | 'craving_decode'
  | 'negative_space_nutrition'
  | 'kin_row'
  | 'tonight_card'
  | 'in_store_copilot'
  | 'encore_recreation'
  | 'heirloom_send'
  | 'growth_mirror'
  | 'acoustic_cooking'

type EntitlementRule = {
  minimumTier: BrioelaTier
  requiredAddon?: BrioelaAddon
  /** When set, allowed if base tier OR this addon on lower tiers (Mesa on Luma/Culina) */
  addonAlternative?: BrioelaAddon
  inherits?: FeatureAction
}

export const TIER_ENTITLEMENT_MATRIX: Record<FeatureAction, EntitlementRule> = {
  recipe_import_unlimited: { minimumTier: BrioelaTier.LUMA },
  receipt_scan: { minimumTier: BrioelaTier.LUMA },
  receipt_price_history: { minimumTier: BrioelaTier.LUMA },
  menu_scan: { minimumTier: BrioelaTier.LUMA },
  map_full: { minimumTier: BrioelaTier.LUMA },
  map_geo_alerts: { minimumTier: BrioelaTier.LUMA },
  community_notes_write: { minimumTier: BrioelaTier.LUMA },
  ground_find_author: { minimumTier: BrioelaTier.LUMA },
  kids_mode: { minimumTier: BrioelaTier.LUMA },
  weekly_food_summary: { minimumTier: BrioelaTier.LUMA },
  meal_plan_full_week: { minimumTier: BrioelaTier.LUMA }, // C1: Luma not legacy Core string
  meal_plan_preview: { minimumTier: BrioelaTier.SAPOR },
  pantry_rescue: { minimumTier: BrioelaTier.CULINA },
  voice_cooking_session: { minimumTier: BrioelaTier.CULINA },
  live_video_cooking: { minimumTier: BrioelaTier.VIVA },
  multi_person_room: { minimumTier: BrioelaTier.VIVA },
  advanced_behavior_reports: { minimumTier: BrioelaTier.VIVA },
  mesa_audience: {
    minimumTier: BrioelaTier.VIVA,
    addonAlternative: BrioelaAddon.MESA,
  },
  verified_profile: { minimumTier: BrioelaTier.SIGNET },
  verified_business: { minimumTier: BrioelaTier.SIGNET },
  craving_decode: { minimumTier: BrioelaTier.LUMA },
  negative_space_nutrition: { minimumTier: BrioelaTier.LUMA },
  kin_row: { minimumTier: BrioelaTier.LUMA },
  tonight_card: { minimumTier: BrioelaTier.LUMA },
  in_store_copilot: { minimumTier: BrioelaTier.CULINA },
  encore_recreation: { minimumTier: BrioelaTier.CULINA },
  heirloom_send: { minimumTier: BrioelaTier.CULINA },
  growth_mirror: { minimumTier: BrioelaTier.CULINA },
  acoustic_cooking: { minimumTier: BrioelaTier.CULINA, inherits: 'voice_cooking_session' },
}
```
