# Draft: tonight.response.constant.ts (gap — file does not exist)

Target: `shared/constants/tonight/tonight.response.constant.ts`

**Gap (feature 54):** User response enum for learning loop.

**Source:** `build-guide/38-tonight/03-learning-loop.md`

---

```typescript
export const TonightResponse = {
  COOKED: 'cooked',
  SWAPPED: 'swapped',
  OPENED: 'opened',
  DISMISSED: 'dismissed',
  IGNORED: 'ignored',
} as const

export type TonightResponse =
  (typeof TonightResponse)[keyof typeof TonightResponse]
```
