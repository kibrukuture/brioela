# Scanner — Scan Result UI

## What This File Covers

The verdict structure, how the base health score is computed, the green/yellow/red verdict logic, what the compact scan result shows vs what is in the expanded view, boycott and origin display, follow-up actions, and the Supabase shared product table that feeds the UI.

---

## Verdict Structure — What the Backend Returns

The backend returns one verdict object. It must not return separate mini-verdicts for nutrition,
medication, origin, label evidence, and community evidence. Those are supporting layers inside the
same result.

The compact result is assertive: one color, one headline reason, one primary action. Expanded details
show how Brioela reached that answer.

The implementation contract for scanner verdicting is:

```typescript
type ScanComputationInput = {
  productFactSnapshot: ResolvedProductFactSnapshot
  communityHealth: ProductCommunityHealthOverlay | null
  constraintResult: ConstraintCheckResult
}

type ProductCommunityHealthOverlay = {
  productId: string
  confidenceScore: number
  evidenceVolumeScore: number
  disagreementScore: number
  reportedEventRate: number | null
  elevatedConditionTags: string[]
}

type VerdictTraceStep =
  | { kind: 'product_identity_resolved'; productId: string; confidence: number }
  | { kind: 'fact_snapshot_built'; approvedForSafetyDecisions: boolean; evidenceCount: number }
  | { kind: 'base_score_computed'; score: number; drivers: string[] }
  | { kind: 'hard_constraint_checked'; matched: boolean; matchCount: number }
  | { kind: 'medication_food_checked'; severity: 'none' | 'note' | 'warn' | 'block' }
  | { kind: 'community_association_checked'; applied: boolean; strongestScore: number | null }
  | { kind: 'origin_context_attached'; boycottMatched: boolean }
  | { kind: 'guardrails_unavailable'; reason: string }
  | { kind: 'final_verdict_built'; level: 'green' | 'yellow' | 'red'; reason: string }

type VerdictTrace = VerdictTraceStep[]
```

`VerdictTrace` is internal/audit data. The compact UI does not show it raw. The expanded result uses it
to explain the verdict as a coherent evidence story.

```typescript
// shared/validator/scan.schema.ts

export const VerdictSchema = z.object({
  level:      z.enum(['green', 'yellow', 'red']),
  reason:     z.string().max(120),          // one sentence — the primary visible text
  score:      z.number().min(0).max(100),   // base health score before constraint overlay
  constraint: z.object({                   // null if no constraint matched
    level:    z.enum(['block', 'boycott', 'warn', 'deprioritize', 'guardrails_unavailable']),
    matches:  z.array(ConstraintMatchSchema),
    medicationFoodInteractions: z.array(MedicationFoodInteractionSchema),
    communityHealthAssociations: z.array(CommunityHealthAssociationSchema),
  }).nullable(),
  communityHealth: z.object({              // null if no community overlay exists
    confidenceScore: z.number().min(0).max(1),
    evidenceVolumeScore: z.number().min(0).max(1),
    disagreementScore: z.number().min(0).max(1),
    reportedEventRate: z.number().nullable(),
    elevatedConditionTags: z.array(z.string()),
  }).nullable(),
  origin: z.object({
    country:        z.string().nullable(),
    parentCompany:  z.string().nullable(),
    boycottActive:  z.boolean(),
  }).nullable(),
  expandedDetail: z.object({
    nutrients:    z.record(z.number()),
    additives:    z.array(z.string()),
    ingredients:  z.array(z.string()),
    sourceRefs:   z.array(z.object({ source: z.string(), id: z.string() })),
    confidence:   z.number(),              // 0.0–1.0 — how confident is this product data
  }),
  trace: z.array(VerdictTraceStepSchema),   // internal/evidence story source, not raw UI copy
})

export type Verdict = z.infer<typeof VerdictSchema>
```

---

## Unified Verdict Assembly

The final verdict is one computation. Separate evidence layers keep their own provenance, but they do
not create separate user experiences.

```text
base score
→ hard personal overrides
→ medication-food interaction cautions
→ community health association cautions
→ origin / boycott context
→ final green / yellow / red
```

Rules:

- Hard allergy, dietary identity, boycott, and confirmed recall behavior can produce red.
- Medication-food interactions can produce yellow or red depending on configured severity.
- Community health associations can upgrade green to yellow when supported by enough anonymous health groups.
- Community health associations cannot clear hard constraints and cannot produce clinical conclusion copy.
- Origin and parent-company context are shown as evidence and can affect verdict only through explicit boycott or recall rules.

The user sees one answer first. Evidence layers appear only when they expand the result.

---

## Base Health Score — `build.verdict.helper.ts`

The score is rule-based — no LLM involved in the scoring path. LLM involvement would add latency; rules are deterministic and fast.

```typescript
// backend/src/api/scan/_helpers/build.verdict.helper.ts

export function computeBaseScore(product: Product): number {
  let score = 100

  // Additives — penalty per additive, weighted by caution class
  const highCautionAdditives = ['E621', 'E951', 'E950', 'E211', 'E102', 'E104', 'E110']
  const medCautionAdditives = ['E200', 'E202', 'E330', 'E300']

  for (const additive of product.additives ?? []) {
    if (highCautionAdditives.includes(additive)) score -= 10
    else if (medCautionAdditives.includes(additive)) score -= 4
    else score -= 2
  }

  // Nutrients — penalty for excess, bonus for good profile
  const nutrients = product.nutrients ?? {}

  if ((nutrients['sugar_per_100g'] ?? 0) > 20)     score -= 15
  else if ((nutrients['sugar_per_100g'] ?? 0) > 10) score -= 7

  if ((nutrients['sodium_per_100g'] ?? 0) > 1.5)     score -= 12
  else if ((nutrients['sodium_per_100g'] ?? 0) > 0.6) score -= 5

  if ((nutrients['saturated_fat_per_100g'] ?? 0) > 10) score -= 10
  else if ((nutrients['saturated_fat_per_100g'] ?? 0) > 5) score -= 4

  if ((nutrients['fiber_per_100g'] ?? 0) > 6)   score += 5
  if ((nutrients['protein_per_100g'] ?? 0) > 10) score += 3

  // Ultra-processed signal — ingredient count > 20 with several unrecognizable names
  const ingCount = (product.ingredients ?? []).length
  if (ingCount > 20) score -= 8
  else if (ingCount > 12) score -= 3

  return Math.max(0, Math.min(100, score))
}

export function buildVerdict(
  product: ResolvedProductFactSnapshot,
  constraintResult: ConstraintCheckResult,
  communityHealth: ProductCommunityHealthOverlay | null,
): Verdict {
  const baseScore = computeBaseScore(product)
  const communityOverlay = buildCommunityHealthVerdictOverlay(communityHealth, constraintResult)
  const trace: VerdictTrace = buildInitialVerdictTrace(product, constraintResult, communityHealth, baseScore)

  if (constraintResult.level === 'guardrails_unavailable') {
    return {
      level:      baseScore >= 40 ? 'yellow' : 'red',
      reason:     'Product facts are available, but personal safety checks are unavailable right now.',
      score:      baseScore,
      constraint: constraintResult,
      communityHealth,
      origin:     buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
      trace: [...trace, { kind: 'guardrails_unavailable', reason: 'constraint check failed' }, { kind: 'final_verdict_built', level: baseScore >= 40 ? 'yellow' : 'red', reason: 'Product facts are available, but personal safety checks are unavailable right now.' }],
    }
  }

  // Constraint overrides base score
  if (constraintResult.level === 'block' || constraintResult.level === 'boycott') {
    return {
      level:      'red',
      reason:     buildConstraintReason(constraintResult.matches[0]!),
      score:      baseScore,
      constraint: constraintResult,
      communityHealth,
      origin:     buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
      trace: [...trace, { kind: 'final_verdict_built', level: 'red', reason: buildConstraintReason(constraintResult.matches[0]!) }],
    }
  }

  if (constraintResult.level === 'warn' || constraintResult.medicationFoodInteractions.length > 0) {
    const warningReason = constraintResult.matches[0]
      ? buildConstraintReason(constraintResult.matches[0])
      : communityOverlay.reason ?? buildScoreReason(baseScore, product)

    return {
      level:      'yellow',
      reason:     warningReason,
      score:      baseScore,
      constraint: constraintResult,
      communityHealth,
      origin:     buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
      trace: [...trace, { kind: 'final_verdict_built', level: 'yellow', reason: warningReason }],
    }
  }

  // No constraint match — base score determines verdict
  const level: 'green' | 'yellow' | 'red' =
    communityOverlay.shouldUpgradeGreenToYellow && baseScore >= 70 ? 'yellow' :
    baseScore >= 70 ? 'green' :
    baseScore >= 40 ? 'yellow' :
    'red'

  return {
    level,
    reason:     communityOverlay.reason ?? buildScoreReason(baseScore, product),
    score:      baseScore,
    constraint: null,
    communityHealth,
    origin:     buildOrigin(product),
    expandedDetail: buildExpandedDetail(product),
    trace: [...trace, { kind: 'final_verdict_built', level, reason: communityOverlay.reason ?? buildScoreReason(baseScore, product) }],
  }
}

function buildInitialVerdictTrace(
  product: ResolvedProductFactSnapshot,
  constraintResult: ConstraintCheckResult,
  communityHealth: ProductCommunityHealthOverlay | null,
  baseScore: number,
): VerdictTrace {
  return [
    { kind: 'product_identity_resolved', productId: product.productId, confidence: product.confidence },
    { kind: 'fact_snapshot_built', approvedForSafetyDecisions: product.approvedForSafetyDecisions, evidenceCount: product.factEvidence.length },
    { kind: 'base_score_computed', score: baseScore, drivers: getBaseScoreDrivers(product) },
    { kind: 'hard_constraint_checked', matched: constraintResult.matches.length > 0, matchCount: constraintResult.matches.length },
    { kind: 'medication_food_checked', severity: getMedicationFoodSeverity(constraintResult.medicationFoodInteractions) },
    { kind: 'community_association_checked', applied: constraintResult.communityHealthAssociations.length > 0, strongestScore: getStrongestAssociationScore(constraintResult.communityHealthAssociations) },
    { kind: 'origin_context_attached', boycottMatched: product.origin?.boycottActive === true },
  ]
}

function buildCommunityHealthVerdictOverlay(
  communityHealth: ProductCommunityHealthOverlay | null,
  constraintResult: ConstraintCheckResult,
): { shouldUpgradeGreenToYellow: boolean; reason: string | null } {
  if (!communityHealth) return { shouldUpgradeGreenToYellow: false, reason: null }

  const hasSupportedAssociation = constraintResult.communityHealthAssociations.some(association =>
    association.eventAssociationScore >= 0.60 && association.supportingHealthGroupCount >= 3,
  )

  if (!hasSupportedAssociation) return { shouldUpgradeGreenToYellow: false, reason: null }

  return {
    shouldUpgradeGreenToYellow: true,
    reason: 'People with a similar profile have reported events after products like this.',
  }
}

function buildConstraintReason(match: ConstraintMatch): string {
  switch (match.constraintType) {
    case 'hard_allergy':
      return `Contains ${match.entityValue} — your listed allergy.`
    case 'intolerance':
      return `Contains ${match.entityValue} — flagged as an intolerance.`
    case 'dietary_identity':
      return `Not compatible with your ${match.entityValue} diet.`
    case 'boycott':
      return `${match.entityValue} — you have this brand blocked.`
    default:
      return `Matched a personal filter: ${match.entityValue}.`
  }
}

function buildScoreReason(score: number, product: Product): string {
  if (score >= 70) return 'Clean ingredient list, no major concerns.'
  if (score >= 55) return 'Moderate — some additives or excess nutrients.'
  if (score >= 40) return 'High sugar, sodium, or several additives.'
  return 'Heavily processed — many additives and poor nutrient profile.'
}
```

---

## Mobile UI — Compact Result (Always Visible)

The compact result is the first thing the user sees. It must be readable in one glance in a grocery store. It should feel composed, not labeled. Avoid placeholder copy like "Product Name" or field-label layouts.

```
┌─────────────────────────────────┐
│  Worth caution                  │
│  Savory Oat Crisps              │
│                                 │
│  Mostly fine. Brioela is being  │
│  careful because MSG matters    │
│  for your profile.              │
│                                 │
│  Save   Avoid   Nearby          │
│  Details                        │
└─────────────────────────────────┘
```

**Hard allergy block:** the compact result is replaced entirely by:

```
┌─────────────────────────────────┐
│  Stop here                      │
│  This lists peanuts.            │
│                                 │
│  Peanuts are in your confirmed  │
│  allergy profile, so Brioela    │
│  is blocking this scan.         │
│                                 │
│  I understand                   │
└─────────────────────────────────┘
```

The user must explicitly tap "I understand" before the normal compact result appears below the warning. This is not a modal — it is inline, but it requires affirmative action.

---

## Mobile UI — Expanded Result (On-Demand)

Tap "Details" to expand. Never shown by default — the compact verdict is the primary surface.

The expanded view should feel like a guided product explanation, not a database dump. Do not use rows
like `Name:`, `Age:`, `Origin:`, or `Source:` unless the whole surface is intentionally technical. Use
natural lines, short clauses, and grouped rhythm.

Evidence-first does not mean score-first. The product answer comes first, then the evidence that
changed or supported it. The score is supporting context, not the headline. See
`01-design-system/13-evidence-first-ui.md` for the cross-product rule.

```
┌─────────────────────────────────┐
│  Worth caution                  │
│  This looks mostly fine. MSG is │
│  why Brioela is being careful   │
│  for your profile.              │
│                                 │
│  People with a similar profile  │
│  have reported headaches more   │
│  often after products with MSG. │
│                                 │
│  78 / 100                       │
│  sugar okay · sodium okay       │
│  fiber helps · 2 additives      │
│                                 │
│  94% confident from the label   │
│  photo and Open Food Facts      │
│                                 │
│  France · Danone                │
│  no boycott match               │
│                                 │
│  Water, oats, cane sugar, MSG…  │
│                                 │
│  Observed association only.     │
│  Not a clinical conclusion.     │
└─────────────────────────────────┘
```

Source + confidence always shown in expanded view. Users can see where the data came from and how certain it is. If confidence is below 70%, a note is shown: "Product data may be incomplete — verify the label."

---

## Boycott Display

When a boycott constraint matches:

```text
Avoid this one
You blocked Danone last month.
Brioela matched this product through the parent company record.
```

The expanded result can show the saved boycott label, date set, and match reason, but it should read
like product copy, not a compliance table.

No editorialized content. The boycott reason shown is exactly what the user entered when they created the rule — never generated by Brioela.

---

## Origin and Parent Company

Shown in expanded view. Pulled from `product_origin` table via the backend.

```typescript
function buildOrigin(product: Product): Verdict['origin'] {
  // origin is joined from product_origin table during product resolution
  if (!product.origin) return null
  return {
    country:       product.origin.originCountry ?? null,
    parentCompany: product.origin.parentCompany ?? null,
    boycottActive: false,  // overridden to true if boycott constraint matched the brand
  }
}
```

---

## Follow-Up Actions

Available after any scan verdict:

| Action | What it does |
|---|---|
| Save | Adds product to user's saved scan history |
| Add Find | Opens a Ground Find draft pre-filled with public product/place facts only |
| Map | Opens map view filtered to products/places near this scan's geoHash |
| Avoid | Calls `propose_user_constraint` with `type: 'dislike'` for primary concerning ingredient |
| Share | Generates share card with verdict and product name |

Avoid is shown only when the verdict is yellow or red with an identifiable ingredient reason. It routes to the constraint proposal flow — the user can confirm the dislike and it becomes persistent.

---

## Scanning Is Always Free

From spec 19: unlimited scanning is free forever. No cap, no paywall, no tier gate. The scan result, including constraint check and verdict, is available to all users regardless of tier.

The only gating that happens at the scan level: advanced features triggered from the scan result (Ground Find authoring requires Luma, certain map features require Luma). The verdict itself is always free.
