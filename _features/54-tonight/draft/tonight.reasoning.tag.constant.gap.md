# Draft: tonight.reasoning.tag.constant.ts (gap — file does not exist)

Target: `shared/constants/tonight/tonight.reasoning.tag.constant.ts`

**Gap (feature 54):** Reasoning tag enum for `tonight_answer.reasoning_tags_json`.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § Data Model

---

```typescript
export const TonightReasoningTag = {
  INVENTORY_COVERED: 'inventory_covered',
  EXPIRING_ITEM: 'expiring_item',
  LOW_READINESS: 'low_readiness',
  MESA_AUDIENCE: 'mesa_audience',
  PLAN_SLOT: 'plan_slot',
  TIME_BUDGET: 'time_budget',
  SINGLE_ITEM_PICKUP: 'single_item_pickup',
  CRAVING_ADJUST: 'craving_adjust',
} as const

export type TonightReasoningTag =
  (typeof TonightReasoningTag)[keyof typeof TonightReasoningTag]

export const TONIGHT_REASONING_TAGS = Object.values(TonightReasoningTag)
```
