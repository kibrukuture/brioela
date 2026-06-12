# Gap snapshot: build.verdict.helper.ts

Target: `backend/src/api/scan/_helpers/build.verdict.helper.ts`

**Status:** Not in repo. Unified assembly from `build-guide/07-scanner/04-scan-result-ui.md` + **23** conditionFlags merge.

---

```typescript
import type {
  Verdict,
  VerdictTrace,
  ConditionFlagResult,
} from '@brioela/shared/validator/scan'
import type { ConstraintCheckResult } from '@/tools/product-scan/check-constraint'
import type {
  ResolvedProductFactSnapshot,
  ProductCommunityHealthOverlay,
} from '@brioela/shared/validator/product'

export function computeBaseScore(product: ResolvedProductFactSnapshot): number {
  let score = 100
  const highCautionAdditives = ['E621', 'E951', 'E950', 'E211', 'E102', 'E104', 'E110']
  const medCautionAdditives = ['E200', 'E202', 'E330', 'E300']

  for (const additive of product.additives ?? []) {
    if (highCautionAdditives.includes(additive)) score -= 10
    else if (medCautionAdditives.includes(additive)) score -= 4
    else score -= 2
  }

  const nutrients = product.nutrients ?? {}
  if ((nutrients['sugar_per_100g'] ?? 0) > 20) score -= 15
  else if ((nutrients['sugar_per_100g'] ?? 0) > 10) score -= 7
  if ((nutrients['sodium_per_100g'] ?? 0) > 1.5) score -= 12
  else if ((nutrients['sodium_per_100g'] ?? 0) > 0.6) score -= 5
  if ((nutrients['saturated_fat_per_100g'] ?? 0) > 10) score -= 10
  else if ((nutrients['saturated_fat_per_100g'] ?? 0) > 5) score -= 4
  if ((nutrients['fiber_per_100g'] ?? 0) > 6) score += 5
  if ((nutrients['protein_per_100g'] ?? 0) > 10) score += 3

  const ingCount = (product.ingredients ?? []).length
  if (ingCount > 20) score -= 8
  else if (ingCount > 12) score -= 3

  return Math.max(0, Math.min(100, score))
}

export function buildVerdict(
  product: ResolvedProductFactSnapshot,
  constraintResult: ConstraintCheckResult,
  communityHealth: ProductCommunityHealthOverlay | null,
  conditionFlags: ConditionFlagResult[] = [],
): Verdict {
  const baseScore = computeBaseScore(product)
  const communityOverlay = buildCommunityHealthVerdictOverlay(communityHealth, constraintResult)
  const trace: VerdictTrace = buildInitialVerdictTrace(
    product,
    constraintResult,
    communityHealth,
    baseScore,
    conditionFlags,
  )

  const hasHardCondition = conditionFlags.some((f) => f.flagLevel === 'hard')

  if (constraintResult.level === 'guardrails_unavailable') {
    return degradedVerdict(baseScore, constraintResult, communityHealth, trace, conditionFlags)
  }

  if (
    constraintResult.level === 'block' ||
    constraintResult.level === 'boycott' ||
    hasHardCondition
  ) {
    const reason = hasHardCondition
      ? (conditionFlags.find((f) => f.flagLevel === 'hard')?.reason ??
        buildConstraintReason(constraintResult.matches[0]!))
      : buildConstraintReason(constraintResult.matches[0]!)

    return {
      level: 'red',
      reason,
      score: baseScore,
      constraint: constraintResult,
      conditionFlags,
      communityHealth,
      origin: buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
      trace: [
        ...trace,
        { kind: 'final_verdict_built', level: 'red', reason },
      ],
    }
  }

  if (constraintResult.level === 'warn' || constraintResult.medicationFoodInteractions.length > 0) {
    const warningReason =
      constraintResult.matches[0]
        ? buildConstraintReason(constraintResult.matches[0])
        : (communityOverlay.reason ?? buildScoreReason(baseScore, product))

    return {
      level: 'yellow',
      reason: warningReason,
      score: baseScore,
      constraint: constraintResult,
      conditionFlags,
      communityHealth,
      origin: buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
      trace: [...trace, { kind: 'final_verdict_built', level: 'yellow', reason: warningReason }],
    }
  }

  const softConditionOnly =
    conditionFlags.length > 0 && conditionFlags.every((f) => f.flagLevel !== 'hard')

  const level: 'green' | 'yellow' | 'red' =
    softConditionOnly ? 'yellow' :
    communityOverlay.shouldUpgradeGreenToYellow && baseScore >= 70 ? 'yellow' :
    baseScore >= 70 ? 'green' :
    baseScore >= 40 ? 'yellow' :
    'red'

  const reason =
    (softConditionOnly ? conditionFlags[0]?.reason : null) ??
    communityOverlay.reason ??
    buildScoreReason(baseScore, product)

  return {
    level,
    reason,
    score: baseScore,
    constraint: constraintResult.matches.length > 0 ? constraintResult : null,
    conditionFlags,
    communityHealth,
    origin: buildOrigin(product),
    expandedDetail: buildExpandedDetail(product),
    trace: [...trace, { kind: 'final_verdict_built', level, reason }],
  }
}

// buildInitialVerdictTrace, buildCommunityHealthVerdictOverlay, buildConstraintReason,
// buildScoreReason, buildOrigin, buildExpandedDetail, degradedVerdict — per 04-scan-result-ui.md
```

**Rule:** One verdict object. Condition rows are a separate array for UI — not merged into `constraint.matches`.
