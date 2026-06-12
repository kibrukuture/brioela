# Draft: kin.serving.gates.constant.ts (gap — file does not exist)

Target: `shared/constants/kin/kin.serving.gates.constant.ts`

**Gap (feature 50):** Hard k-anonymity floors from `build-guide/34-kin/02-aggregate-tables-and-k-anonymity.md`.

---

```typescript
/** Minimum derived meal-window contributions before a product_kin_response row may serve */
export const MIN_KIN_SAMPLE_COUNT = 20 as const

/** Minimum opted-in users in cluster before any product row for that cluster may serve */
export const MIN_KIN_CLUSTER_MEMBERS = 100 as const

/** Minimum glucose_meal_window rows before cluster assignment or contribution */
export const MIN_KIN_WINDOWS_FOR_ASSIGNMENT = 10 as const

/** Initial coarse cluster topology — tune from data; reassignment is ops event */
export const KIN_CLUSTER_COUNT_INITIAL_MIN = 8 as const
export const KIN_CLUSTER_COUNT_INITIAL_MAX = 16 as const

/** Contribution time bucketing — no finer granularity in aggregate store */
export const KIN_CONTRIBUTION_BUCKET_DAYS = 7 as const
```
