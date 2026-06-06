# Scanner — Constraint Check

## What This File Covers

How a resolved product is checked against the user's full constraint profile: hard allergy interrupt, intolerance warning, dislike deprioritization, dietary identity filtering, boycott flagging, and drug-food interaction check. All pulled from the Orchestrator DO.

---

## Core Rule

The constraint check runs against the user's Orchestrator DO — not against Supabase. The DO holds the user's private `constraints` table and `user_memory.health.medications`. Supabase knows nothing about individual user constraints.

The check is a single HTTP call to the DO, not a series of calls. The DO reads its own SQLite, does all matching, and returns one structured result.

---

## The Check Tool

`check-constraint.ts` lives under `tools/product-scan/`. It is the only place in the codebase that does ingredient matching against user constraints.

```typescript
// tools/product-scan/check-constraint.ts

import { eq, and } from 'drizzle-orm'
import type { DrizzleDB } from '@/types/db'
import type { Product } from '@brioela/shared'

export type ConstraintLevel = 'block' | 'warn' | 'deprioritize' | 'boycott' | 'clear'

export interface ConstraintCheckResult {
  level:   ConstraintLevel          // highest severity match, or 'clear' if no match
  matches: ConstraintMatch[]        // all matched constraints, sorted severity DESC
  drugInteractions: DrugInteraction[] // medication-ingredient interactions found
}

export interface ConstraintMatch {
  constraintId:   string
  constraintType: string            // 'hard_allergy' | 'intolerance' | 'dislike' | 'dietary_identity' | 'boycott'
  entityValue:    string            // what matched: 'peanuts', 'Nestlé'
  matchedVia:     string            // ingredient name or brand name that triggered the match
  severity:       ConstraintLevel
}

export interface DrugInteraction {
  drug:        string               // medication name from user_memory
  ingredient:  string               // ingredient in this product that interacts
  interaction: string               // description of the interaction
  severity:    'high' | 'moderate' | 'note'
}

export async function checkProductConstraints(
  product: Product,
  db: DrizzleDB,
): Promise<ConstraintCheckResult> {
  const matches:          ConstraintMatch[]  = []
  const drugInteractions: DrugInteraction[]  = []

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
        // Brand match or parent company match
        const brandMatch = productBrand.includes(target) || target.includes(productBrand)
        if (brandMatch) {
          matches.push({
            constraintId:   constraint.id,
            constraintType: 'boycott',
            entityValue:    constraint.entityValue,
            matchedVia:     product.brand ?? '',
            severity:       'boycott',
          })
        }
        break
      }
    }
  }

  // Drug-food interaction check
  // Read medications from user_memory
  const medications = db.select()
    .from(userMemory)
    .where(and(
      eq(userMemory.namespace, 'health.medications'),
      eq(userMemory.active, 1),
    ))
    .all()

  if (medications.length > 0) {
    const interactions = checkDrugFoodInteractions(
      medications.map(m => m.key),  // medication names
      productIngredients,
    )
    drugInteractions.push(...interactions)
  }

  // Determine overall severity level
  const severityOrder: ConstraintLevel[] = ['block', 'boycott', 'warn', 'deprioritize', 'clear']
  const highestSeverity = matches.length === 0
    ? (drugInteractions.some(d => d.severity === 'high') ? 'warn' : 'clear')
    : severityOrder.find(s => matches.some(m => m.severity === s)) ?? 'clear'

  // Sort matches by severity
  matches.sort((a, b) =>
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  )

  return { level: highestSeverity, matches, drugInteractions }
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
    // Constraint check failed — fail open (return 'clear') to not block scanning
    // Log failure to agent_state for investigation
    console.error('Constraint check failed:', response.status)
    return { level: 'clear', matches: [], drugInteractions: [] }
  }

  return response.json() as Promise<ConstraintCheckResult>
}
```

**Fail open rule:** if the constraint check fails for any reason (DO timeout, network error), the scan returns a `clear` verdict with a note that the constraint check was unavailable. Scanning is never blocked by a technical failure of the constraint system. Hard allergy protection depends on the system being up — this is a known acceptable risk for a network-dependent feature.

---

## Severity Levels and What They Do

| Level | Constraint type | UI behavior |
|---|---|---|
| `block` | hard_allergy, dietary_identity | Verdict = red, hard interrupt. Warning shown before any other content. User must dismiss explicitly. |
| `boycott` | boycott | Verdict = red, boycott badge shown. "You have this brand blocked." |
| `warn` | intolerance, high drug interaction | Verdict = yellow. Warning visible in expanded view. Does not interrupt primary scan flow. |
| `deprioritize` | dislike | Verdict unchanged, no badge. Dislike signal logged but not surfaced to user. |
| `clear` | no match | Verdict determined by base health score only. |

A product can have multiple matches at different levels. The highest severity determines the overall verdict level. All matches are shown in the expanded view.

---

## Proposed Constraint Surfacing During Scan

If the scan result contains a new pattern that might indicate a constraint the user has not declared, the Orchestrator DO can surface a proposal after delivering the verdict — not during it.

Example: user has scanned products containing peanuts 5 times and always received a yellow from a prior soft dislike signal. The Orchestrator proposes: "You seem to avoid peanuts — is that an allergy I should always block?"

This proposal:
- Never delays the scan verdict
- Appears as a secondary card below the verdict
- Routes to `propose_user_constraint` tool if user confirms
- Is rate-limited: never more than once per 7 days for the same proposed constraint
