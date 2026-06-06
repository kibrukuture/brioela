# Scanner — Scan Result UI

## What This File Covers

The verdict structure, how the base health score is computed, the green/yellow/red verdict logic, what the compact scan result shows vs what is in the expanded view, boycott and origin display, follow-up actions, and the Supabase shared product table that feeds the UI.

---

## Verdict Structure — What the Backend Returns

```typescript
// shared/validator/scan.schema.ts

export const VerdictSchema = z.object({
  level:      z.enum(['green', 'yellow', 'red']),
  reason:     z.string().max(120),          // one sentence — the primary visible text
  score:      z.number().min(0).max(100),   // base health score before constraint overlay
  constraint: z.object({                   // null if no constraint matched
    level:    z.enum(['block', 'boycott', 'warn', 'deprioritize']),
    matches:  z.array(ConstraintMatchSchema),
    drugInteractions: z.array(DrugInteractionSchema),
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
})

export type Verdict = z.infer<typeof VerdictSchema>
```

---

## Base Health Score — `build.verdict.helper.ts`

The score is rule-based — no LLM involved in the scoring path. LLM involvement would add latency; rules are deterministic and fast.

```typescript
// backend/src/api/scan/_helpers/build.verdict.helper.ts

export function computeBaseScore(product: Product): number {
  let score = 100

  // Additives — penalty per additive, weighted by risk class
  const highRiskAdditives  = ['E621', 'E951', 'E950', 'E211', 'E102', 'E104', 'E110']
  const medRiskAdditives   = ['E200', 'E202', 'E330', 'E300']

  for (const additive of product.additives ?? []) {
    if (highRiskAdditives.includes(additive)) score -= 10
    else if (medRiskAdditives.includes(additive)) score -= 4
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
  product: Product,
  constraintResult: ConstraintCheckResult,
): Verdict {
  const baseScore = computeBaseScore(product)

  // Constraint overrides base score
  if (constraintResult.level === 'block' || constraintResult.level === 'boycott') {
    return {
      level:      'red',
      reason:     buildConstraintReason(constraintResult.matches[0]!),
      score:      baseScore,
      constraint: constraintResult,
      origin:     buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
    }
  }

  if (constraintResult.level === 'warn' || constraintResult.drugInteractions.length > 0) {
    return {
      level:      'yellow',
      reason:     buildConstraintReason(constraintResult.matches[0]!) ?? buildScoreReason(baseScore, product),
      score:      baseScore,
      constraint: constraintResult,
      origin:     buildOrigin(product),
      expandedDetail: buildExpandedDetail(product),
    }
  }

  // No constraint match — base score determines verdict
  const level: 'green' | 'yellow' | 'red' =
    baseScore >= 70 ? 'green' :
    baseScore >= 40 ? 'yellow' :
    'red'

  return {
    level,
    reason:     buildScoreReason(baseScore, product),
    score:      baseScore,
    constraint: null,
    origin:     buildOrigin(product),
    expandedDetail: buildExpandedDetail(product),
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

The compact result is the first thing the user sees. It must be readable in one glance in a grocery store.

```
┌─────────────────────────────────┐
│  ●  GREEN / YELLOW / RED        │  ← verdict circle, color-coded
│  Product Name                   │
│  Brand Name                     │
│  "Clean ingredient list..."     │  ← one sentence reason
│  [Save]  [Add Note]  [Map]      │  ← follow-up actions
│  ▼ Details                      │  ← tap to expand
└─────────────────────────────────┘
```

**Hard allergy block:** the compact result is replaced entirely by:

```
┌─────────────────────────────────┐
│  ⚠  CONTAINS PEANUTS            │  ← red, full-width, dismissible
│  Your listed allergy            │
│  [I understand, show details]   │  ← explicit user override required
└─────────────────────────────────┘
```

The user must explicitly tap "I understand" before the normal compact result appears below the warning. This is not a modal — it is inline, but it requires affirmative action.

---

## Mobile UI — Expanded Result (On-Demand)

Tap "▼ Details" to expand. Never shown by default — the compact verdict is the primary surface.

```
┌─────────────────────────────────┐
│  Score: 78/100                  │
│                                 │
│  Nutrients per 100g             │
│  Sugar:    8g  ●                │
│  Sodium:   0.4g ●               │
│  Saturated fat: 2g ●            │
│  Fiber:    4g  ✓                │
│                                 │
│  Additives                      │
│  E330 (citric acid)             │
│                                 │
│  Origin: France                 │
│  Parent company: Danone         │
│                                 │
│  Ingredients                    │
│  Water, oats, cane sugar...     │
│                                 │
│  Source: Open Food Facts        │
│  Confidence: 94%                │
└─────────────────────────────────┘
```

Source + confidence always shown in expanded view. Users can see where the data came from and how certain it is. If confidence is below 70%, a note is shown: "Product data may be incomplete — verify the label."

---

## Boycott Display

When a boycott constraint matches:

- Compact result: verdict = red, reason = "You have [brand] blocked"
- Expanded: shows "Boycott active" with the user's saved boycott label, date set, match reason

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
| Add Note | Opens Ground note creation pre-filled with this product |
| Map | Opens map view filtered to products/places near this scan's geoHash |
| Avoid | Calls `propose_user_constraint` with `type: 'dislike'` for primary concerning ingredient |
| Share | Generates share card with verdict and product name |

Avoid is shown only when the verdict is yellow or red with an identifiable ingredient reason. It routes to the constraint proposal flow — the user can confirm the dislike and it becomes persistent.

---

## Scanning Is Always Free

From spec 19: unlimited scanning is free forever. No cap, no paywall, no tier gate. The scan result, including constraint check and verdict, is available to all users regardless of tier.

The only gating that happens at the scan level: advanced features triggered from the scan result (community note authoring requires Luma, certain map features require Luma). The verdict itself is always free.
