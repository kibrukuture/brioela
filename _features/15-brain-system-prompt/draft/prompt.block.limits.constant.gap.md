# Draft: prompt.block.limits.constant.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_constants/prompt.block.limits.constant.ts`

**Gap (feature 15):** Personality top-N limit — `03-user-personality.md` says "top N" but **the spec does not define N**.

---

## Intended production file (full snapshot — not yet created)

```typescript
/**
 * Max active personality traits injected into the system prompt.
 * implementable-specs/03-user-personality.md requires top-N truncation but does not specify N.
 * Default 15 — revise with product evidence if prefix token budget requires lower.
 */
export const PERSONALITY_TRAIT_LIMIT = 15
```

Source: `implementable-specs/03-user-personality.md` line 175; `build-guide/06-brain-memory/01-sqlite-schema.md` line 190.
