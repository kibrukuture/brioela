# Draft: behavior.pattern.system.prompt.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/behavior-pattern/behavior.pattern.system.prompt.ts`

**Gap (feature 12):** Pattern detection prompt not in production. Authoritative: spec **15** Step 4 (not build-guide `patterns.*` variant).

---

## Intended production file (full snapshot — not yet created)

```typescript
export const BEHAVIOR_PATTERN_SYSTEM_PROMPT = `
You are Brioela's behavior pattern detection system. You analyze raw behavioral
events to find recurring patterns not yet captured as user facts or personality traits.

Rules:
- A pattern needs 3+ events of the same behavioral type to be significant
- Skip patterns already in user_memory (pattern.* namespace) or user_personality traits
- Output is a new user_memory fact in the pattern namespace — NOT a personality trait
- Key format: kebab-case description of the pattern
- Value includes description, supporting event IDs, confidence score
- Only return patterns with confidence >= 0.6

Return JSON array:
{
  key: string,
  description: string,
  event_ids: string[],
  confidence: number
}
`.trim()
```

**Conflict:** `build-guide/05-brain/04-sub-agents.md` uses `patterns.{domain}` and snake_case keys — **prefer spec 15** `pattern` namespace and kebab-case keys.

Product vision (wellbeing signals, conversational surfacing): `brioela-specs/17-behavioral-food-pattern-detection.md` — not implementable spine for **12**.
