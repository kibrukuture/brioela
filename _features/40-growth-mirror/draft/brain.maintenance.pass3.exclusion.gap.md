# Draft: brain.maintenance.system.prompt.ts — Pass 3 exclusion (gap — delta)

Target: `backend/src/agents/brain/_subagents/brain-maintenance/brain.maintenance.system.prompt.ts`

**Gap:** Pass 3 trait inference (**12**) could duplicate **40** by inferring cooking-skill traits into `user_personality`.

**Source:** `_features/12-brain-sub-agents/spec.md` Pass 3 vs `_features/40-growth-mirror/spec.md` § vs **12**

**Rule:** Pass 3 synthesizes behavioral/lifestyle traits from `user_memory`. Cooking-skill growth is owned exclusively by **40** `skill_trajectory` Pass 4.

---

```typescript
export const BRAIN_MAINTENANCE_PASS_3_TRAIT_INFERENCE_RULES = `
Rules:
- Only propose traits supported by 3+ distinct user_memory entries
- Never duplicate an existing trait
- Initial strength: 0.4–0.7 only

EXCLUSION — Growth Mirror owns cooking skill (feature 40):
- Do NOT infer traits about cooking technique growth, knife skills, heat control,
  timing ability, recipe difficulty progression, or any dimension tracked by skill_trajectory.
- Examples of FORBIDDEN traits: improving-knife-work, confident-saucier, better-at-timing,
  advanced-home-cook, heat-control-improving.
- Cooking session facts may support behavioral traits (e.g. family-cook, weekend-baker)
  when the pattern is about lifestyle identity — not measured skill competence.
- Skill evidence memory_event rows and vision_event interventions are NOT inputs to Pass 3.
  Pass 3 reads user_memory only.
`
```
