# Draft: run.ambient.behavior.pattern.pass.handler.gap.md (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/run.ambient.behavior.pattern.pass.handler.ts`

**Gap (feature 35):** Ambient product layer after **12** BehaviorPatternAgent — wellbeing correlations, stricter thresholds, intervention candidates. **G1:** chain after spawn, do not duplicate unconstrained LLM detector.

**Source:** `build-guide/18-ambient-intelligence/02-behavioral-patterns.md`, `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'

const HEALTH_CORRELATION_MIN_INSTANCES = 5
const HEALTH_CORRELATION_MIN_CONFIDENCE = 0.75

export async function runAmbientBehaviorPatternPass(
  database: BrainDatabase,
  brain: BrioelaBrain,
  input: { userId: string; now: number },
): Promise<void> {
  // Step 1: ensure **12** BehaviorPatternAgent completed for this wake (or await spawn)
  // TODO(12): spawnBehaviorPattern — writes pattern.* user_memory

  // Step 2: load wellbeing_signal rows since last ambient pattern pass
  // Step 3: load existing behavior_pattern + pattern.* memory — skip duplicates
  // Step 4: correlation pass — explicit thresholds, evidence JSON
  // Step 5: promote to behavior_pattern status active when thresholds met
  // Step 6: create ambient_candidate kind behavior_pattern_intervention (not surfaced here)
  // Step 7: enforce weekly insight budget — max 1 new intervention candidate per 7d

  // Never write user_personality — **12** BrainMaintenanceAgent only
}

export function meetsHealthCorrelationThreshold(instanceCount: number, confidence: number): boolean {
  return instanceCount >= HEALTH_CORRELATION_MIN_INSTANCES && confidence >= HEALTH_CORRELATION_MIN_CONFIDENCE
}
```

**35 vs 12:** Agent discovers generic `pattern.*` (3+ events, ≥0.6). This pass promotes product-facing patterns and intervention copy with stricter wellbeing rules.
