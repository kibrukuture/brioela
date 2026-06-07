# Scanner — Constraint Check

## What This File Covers

How a resolved product is checked against the user's full constraint profile: hard allergy interrupt, intolerance warning, dislike deprioritization, dietary identity filtering, boycott flagging, medication-food interaction check, and cached community health associations. User-private checks are pulled from the Orchestrator DO; community summaries are cached/materialized shared evidence.

---

## Core Rule

The constraint check runs against the user's Orchestrator DO — not against Supabase. The DO holds the user's private `constraints` and `medications` tables. `user_memory.health.medications` is only a prompt/context mirror, not the operational source for scan safety logic. Supabase knows nothing about individual user constraints.

The check is a single HTTP call to the DO, not a series of calls. The DO reads its own SQLite, does all matching, and returns one structured result.

---

## The Check Tool

`check-constraint.ts` lives under `tools/product-scan/`. It is the only place in the codebase that does ingredient matching against user constraints.

```typescript
// tools/product-scan/check-constraint.ts

import { eq, and } from 'drizzle-orm'
import type { DrizzleDB } from '@/types/db'
import type { Product } from '@brioela/shared'

export type ConstraintLevel = 'block' | 'warn' | 'deprioritize' | 'boycott' | 'clear' | 'guardrails_unavailable'

export interface ConstraintCheckResult {
  level:   ConstraintLevel          // highest severity match, or 'clear' if no match
  matches: ConstraintMatch[]        // all matched constraints, sorted severity DESC
  medicationFoodInteractions: MedicationFoodInteraction[]
  communityHealthAssociations: CommunityHealthAssociation[]
}

export interface ConstraintMatch {
  constraintId:   string
  constraintType: string            // 'hard_allergy' | 'intolerance' | 'dislike' | 'dietary_identity' | 'boycott'
  entityValue:    string            // what matched: 'peanuts', 'Nestlé'
  matchedVia:     string            // ingredient name or brand name that triggered the match
  severity:       ConstraintLevel
}

export interface MedicationFoodInteraction {
  medication:  string               // medication category or reviewed medication name from private medications table
  ingredient:  string               // ingredient in this product that interacts
  interaction: string               // description of the interaction
  severity:    'high' | 'moderate' | 'note'
}

export interface CommunityHealthAssociation {
  ingredientName: string
  reportedConditionTag: string
  postExposureEventKind: string
  eventAssociationScore: number
  supportingHealthGroupCount: number
  plainLanguageAssociationSummary: string
  severity: 'warn' | 'deprioritize'
}

export async function checkProductConstraints(
  product: Product,
  db: DrizzleDB,
): Promise<ConstraintCheckResult> {
  const matches:                      ConstraintMatch[] = []
  const medicationFoodInteractions:    MedicationFoodInteraction[] = []
  const communityHealthAssociations:   CommunityHealthAssociation[] = []

  // Load all active confirmed constraints
  const activeConstraints = db.select()
    .from(constraints)
    .where(and(
      eq(constraints.status, 'confirmed'),
    ))
    .all()

  // Ingredient list from the product — normalized to lowercase for matching
  const productIngredients = (product.ingredients ?? []).map((i: string) => i.toLowerCase())
  const productBrand       = (product.brand ?? '').toLowerCase()
  const productAdditives   = (product.additives ?? []) as string[]

  for (const constraint of activeConstraints) {
    const target = constraint.entityValue.toLowerCase()

    switch (constraint.constraintType) {
      case 'hard_allergy':
      case 'intolerance': {
        // Check ingredients + additives for match
        const directMatch = productIngredients.some(ing => ingredientMatches(ing, target))
        const additivMatch = productAdditives.some(add => add.toLowerCase().includes(target))

        if (directMatch || additivMatch) {
          matches.push({
            constraintId:   constraint.id,
            constraintType: constraint.constraintType,
            entityValue:    constraint.entityValue,
            matchedVia:     directMatch
              ? productIngredients.find(i => ingredientMatches(i, target))!
              : productAdditives.find(a => a.toLowerCase().includes(target))!,
            severity: constraint.constraintType === 'hard_allergy' ? 'block' : 'warn',
          })
        }
        break
      }

      case 'dislike': {
        const matched = productIngredients.some(ing => ingredientMatches(ing, target))
        if (matched) {
          matches.push({
            constraintId:   constraint.id,
            constraintType: 'dislike',
            entityValue:    constraint.entityValue,
            matchedVia:     productIngredients.find(i => ingredientMatches(i, target))!,
            severity:       'deprioritize',
          })
        }
        break
      }

      case 'dietary_identity': {
        // e.g. 'vegan' checks for ANY animal-derived ingredient
        // Rules live in Supabase versioned config — fetched at resolution time, not hardcoded
        const violated = checkDietaryIdentity(target, productIngredients, productAdditives)
        if (violated) {
          matches.push({
            constraintId:   constraint.id,
            constraintType: 'dietary_identity',
            entityValue:    constraint.entityValue,
            matchedVia:     violated,
            severity:       'block',
          })
        }
        break
      }

      case 'boycott': {
        // Brand match or parent company match. Parent company is joined from product_origin during product resolution.
        const productParentCompany = (product.origin?.parentCompany ?? '').toLowerCase()
        const brandMatch = productBrand.includes(target) || target.includes(productBrand)
        const parentCompanyMatch = productParentCompany.length > 0 && (productParentCompany.includes(target) || target.includes(productParentCompany))
        if (brandMatch || parentCompanyMatch) {
          matches.push({
            constraintId:   constraint.id,
            constraintType: 'boycott',
            entityValue:    constraint.entityValue,
            matchedVia:     parentCompanyMatch ? product.origin?.parentCompany ?? '' : product.brand ?? '',
            severity:       'boycott',
          })
        }
        break
      }
    }
  }

  // Medication-food interaction check
  // Read structured active medications from private Orchestrator SQLite.
  const medications = db.select()
    .from(medicationsTable)
    .where(and(
      eq(medicationsTable.active, 1),
    ))
    .all()

  if (medications.length > 0) {
    const interactions = checkMedicationFoodInteractions(
      medications.map(m => m.medicationCategory),
      productIngredients,
    )
    medicationFoodInteractions.push(...interactions)
  }

  // Community health association overlay
  // Reads cached/materialized summaries; never performs a live full-table community query in the scan path.
  const userConditionTags = getUserConditionTags(db)
  const ingredientAssociationSignals = await fetchIngredientEventAssociationSignals(
    productIngredients,
    userConditionTags,
  )

  for (const signal of ingredientAssociationSignals) {
    if (signal.eventAssociationScore < 0.60 || signal.supportingHealthGroupCount < 3) continue

    communityHealthAssociations.push({
      ingredientName: signal.ingredientName,
      reportedConditionTag: signal.reportedConditionTag,
      postExposureEventKind: signal.postExposureEventKind,
      eventAssociationScore: signal.eventAssociationScore,
      supportingHealthGroupCount: signal.supportingHealthGroupCount,
      plainLanguageAssociationSummary: signal.plainLanguageAssociationSummary,
      severity: signal.eventAssociationScore > 0.80 ? 'warn' : 'deprioritize',
    })
  }

  // Determine overall severity level
  const severityOrder: ConstraintLevel[] = ['block', 'boycott', 'warn', 'deprioritize', 'clear']
  const highestSeverity = matches.length === 0
    ? (medicationFoodInteractions.some(d => d.severity === 'high') || communityHealthAssociations.some(a => a.severity === 'warn') ? 'warn' : 'clear')
    : severityOrder.find(s => matches.some(m => m.severity === s)) ?? 'clear'

  // Sort matches by severity
  matches.sort((a, b) =>
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  )

  return { level: highestSeverity, matches, medicationFoodInteractions, communityHealthAssociations }
}
```

---

## Ingredient Matching — Synonym Resolution

A simple string equality check misses real matches. "Tree nut" should match "cashew". "Dairy" should match "milk solids". "Gluten" should match "wheat flour".

```typescript
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'peanut':        ['peanut', 'groundnut', 'arachis oil', 'peanut butter', 'monkey nuts'],
  'tree nut':      ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut'],
  'dairy':         ['milk', 'milk solids', 'whey', 'lactose', 'casein', 'butter', 'cream', 'cheese'],
  'gluten':        ['wheat', 'wheat flour', 'barley', 'rye', 'spelt', 'semolina', 'oat'],
  'shellfish':     ['shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster'],
  'soy':           ['soy', 'soya', 'soy flour', 'soy protein', 'edamame', 'tofu', 'tempeh'],
  'egg':           ['egg', 'albumin', 'lecithin', 'lysozyme', 'mayonnaise'],
  'fish':          ['fish', 'anchovy', 'cod', 'tuna', 'salmon', 'sardine', 'halibut'],
  'mustard':       ['mustard', 'mustard seed', 'mustard powder', 'mustard oil'],
  'sesame':        ['sesame', 'tahini', 'sesame oil', 'sesame seed'],
  // Extended dynamically — full list maintained in Supabase versioned config
}

function ingredientMatches(ingredient: string, target: string): boolean {
  if (ingredient.includes(target)) return true

  const synonyms = INGREDIENT_SYNONYMS[target] ?? []
  return synonyms.some(syn => ingredient.includes(syn))
}
```

The synonym list is a starting point. The full list lives in Supabase as versioned config — `brioela.ingredient_synonyms` — updated without a deploy as new synonym pairs are discovered. The backend fetches the current list at startup and caches it in Redis with a 24h TTL.

---

## How the Constraint Check Is Called From the Handler

The `check-constraint` tool runs inside the Orchestrator DO. When `resolveScan()` in the Hono handler needs the constraint result, it makes a call to the DO's internal endpoint:

```typescript
// backend/src/api/scan/_helpers/check.constraints.helper.ts

export async function checkConstraints(
  product: Product,
  userId: string,
  env: Env,
): Promise<ConstraintCheckResult> {
  const orchestratorId = env.ORCHESTRATOR.idFromName(userId)
  const orchestrator   = env.ORCHESTRATOR.get(orchestratorId)

  const response = await orchestrator.fetch(new Request('https://internal/check-constraints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.INTERNAL_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ product }),
  }))

  if (!response.ok) {
    // Constraint check failed — return degraded state, not clear/safe.
    // Log failure to agent_state for investigation
    console.error('Constraint check failed:', response.status)
    return { level: 'guardrails_unavailable', matches: [], medicationFoodInteractions: [], communityHealthAssociations: [] }
  }

  return response.json() as Promise<ConstraintCheckResult>
}
```

**Degraded guardrails rule:** if the constraint check fails for any reason (DO timeout, network error), the scan may still return product facts and a base score, but it must not return `clear` or imply personal safety checks passed. The UI shows that personal allergy, medication, and condition checks were unavailable. Scanning is not blocked by a technical failure, but hard allergy protection depends on the system being up — this is a known limitation for a network-dependent feature.

---

## Severity Levels and What They Do

| Level | Constraint type | UI behavior |
|---|---|---|
| `block` | hard_allergy, dietary_identity | Verdict = red, hard interrupt. Warning shown before any other content. User must dismiss explicitly. |
| `boycott` | boycott | Verdict = red, boycott badge shown. "You have this brand blocked." |
| `warn` | intolerance, high medication-food interaction, strong community health association | Verdict = yellow. Warning visible in expanded view. Does not interrupt primary scan flow. |
| `deprioritize` | dislike | Verdict unchanged, no badge. Dislike signal logged but not surfaced to user. |
| `clear` | no match | Verdict determined by base health score only. |
| `guardrails_unavailable` | DO timeout or internal check failure | Verdict uses product facts only and displays a degraded-state note. Never says personal checks passed. |

A product can have multiple matches at different levels. The highest severity determines the overall verdict level. All matches are shown in the expanded view.

Community health associations can upgrade a green base verdict to yellow when the association is strong enough and supported by enough independent anonymous health groups. They never clear hard allergies, never create clinical conclusions, and never create a hard red block by themselves.

---

## Proposed Constraint Surfacing During Scan

If the scan result contains a new pattern that might indicate a constraint the user has not declared, the Orchestrator DO can surface a proposal after delivering the verdict — not during it.

Example: user has scanned products containing peanuts 5 times and always received a yellow from a prior soft dislike signal. The Orchestrator proposes: "You seem to avoid peanuts — is that an allergy I should always block?"

This proposal:
- Never delays the scan verdict
- Appears as a secondary card below the verdict
- Routes to `propose_user_constraint` tool if user confirms
- Is rate-limited: never more than once per 7 days for the same proposed constraint
