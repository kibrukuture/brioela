# Gap snapshot: run.ai.gate.helper.ts

Target: `backend/src/api/finds/_helpers/run.ai.gate.helper.ts`

**Status:** Not in repo. From `build-guide/09-ground/02-authenticity-gate.md`, `brioela-specs/35`.

```typescript
import type { FindGateResult, FindSignalType } from '@brioela/shared/validator/find'
import { FindGateResultSchema } from '@brioela/shared/validator/find'
import { generateStructuredObject } from '@/core/ai/generate-structured-object'

type RunAiGateInput = {
  content: string
  signalType: FindSignalType
  locationId: string
  capturedAt: string
  env: Env
}

const GATE_CHECKS = [
  'specificity',
  'no_promotion',
  'no_negativity_targeting',
  'freshness_plausibility',
  'no_personal_information',
  'minimum_information_density',
] as const

export async function runAiGate(input: RunAiGateInput): Promise<FindGateResult> {
  const started = Date.now()

  const result = await generateStructuredObject({
    model: 'gpt-4o-mini',
    schema: FindGateResultSchema,
    prompt: buildGatePrompt(input),
    env: input.env,
  })

  const elapsed = Date.now() - started
  if (elapsed > 1500) {
    console.warn('ground_gate_slow', { elapsedMs: elapsed, locationId: input.locationId })
  }

  for (const check of GATE_CHECKS) {
    if (!result.checks.some((c) => c.check === check)) {
      throw new Error(`gate_missing_check:${check}`)
    }
  }

  return result
}

function buildGatePrompt(input: RunAiGateInput): string {
  return [
    'You are the Brioela Ground authenticity gate.',
    'Ground Finds are anonymous observations about food in the physical world — not reviews, not promotions.',
    'Evaluate the submission. All checks must pass for approval.',
    '',
    `Signal type: ${input.signalType}`,
    `Location id: ${input.locationId}`,
    `Captured at: ${input.capturedAt}`,
    `Content: ${input.content}`,
    '',
    'Return pass/fail with a user-facing rejectionReason if any check fails.',
    'Checks: specificity, no_promotion, no_negativity_targeting, freshness_plausibility, no_personal_information, minimum_information_density.',
    'Face detection is handled separately — do not include face_detection in checks.',
  ].join('\n')
}
```

**Latency target:** under 1.5 seconds — single structured LLM call, not a chain.
