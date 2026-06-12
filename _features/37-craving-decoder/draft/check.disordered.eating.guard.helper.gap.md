# Draft: check.disordered.eating.guard.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/craving-decoder/check.disordered.eating.guard.helper.ts`

**Gap:** No predicate for disordered-eating guard — skill + sacred block depend on this.

**Source:** `build-guide/39-craving-decoder/03-safety-guard.md`

---

```typescript
const COMPENSATORY_PATTERNS = [
  /\bi\s+need\s+to\s+burn\b/i,
  /\bmake\s+up\s+for\b/i,
  /\bearn\s+this\b/i,
  /\bpunish\s+myself\b/i,
  /\bdon'?t\s+deserve\b/i,
  /\bcheat\s+meal\b/i,
  /\bguilty\b/i,
] as const

const RESTRICTION_PATTERNS = [
  /\bonly\s+\d+\s+calories\b/i,
  /\bfast\s+until\b/i,
  /\bnot\s+eat\s+for\s+\d+\s+days\b/i,
  /\bpurge\b/i,
] as const

export type DisorderedEatingGuardResult = {
  triggered: boolean
  reason: 'compensatory' | 'punishment' | 'extreme_restriction' | null
  declineCopy: string
}

const DEFAULT_DECLINE =
  "I hear you — I don't think analyzing cravings that way would be helpful for you right now. I'm here if you want to talk about food in a different way."

export function checkDisorderedEatingGuard(userText: string): DisorderedEatingGuardResult {
  for (const pattern of COMPENSATORY_PATTERNS) {
    if (pattern.test(userText)) {
      return { triggered: true, reason: 'compensatory', declineCopy: DEFAULT_DECLINE }
    }
  }
  for (const pattern of RESTRICTION_PATTERNS) {
    if (pattern.test(userText)) {
      return { triggered: true, reason: 'extreme_restriction', declineCopy: DEFAULT_DECLINE }
    }
  }
  if (/\bshouldn'?t\s+want\b/i.test(userText) || /\bdisgusting\b/i.test(userText)) {
    return { triggered: true, reason: 'punishment', declineCopy: DEFAULT_DECLINE }
  }
  return { triggered: false, reason: null, declineCopy: '' }
}
```

**Implementation note:** v1 regex guard is a floor — agent must also refuse via skill when tone implies disorder without keyword match. Sacred block stores `disordered_eating_guard_active` on session when triggered.
