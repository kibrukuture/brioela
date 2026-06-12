# Gap snapshot: check-dish-constraint.ts

Target: `tools/menu-scan/check-dish-constraint.ts`

**Status:** Not in repo. **07** matching logic; **26** Brain DO internal route body. From `03-dish-verdicts.md`, `07-scanner/03-constraint-check.md`.

```typescript
import { and, eq } from 'drizzle-orm'
import type { DrizzleDB } from '@/types/db'
import { constraints } from '@/agents/brain/_schemas/constraint.schema'
import type { ParsedMenuDish } from '@brioela/shared/validator/menu.scan'

export type DishConstraintLevel =
  | 'block'
  | 'warn'
  | 'deprioritize'
  | 'clear'
  | 'guardrails_unavailable'

export type DishConstraintMatch = {
  constraintType: string
  entityValue: string
  severity: 'hard' | 'soft'
  matchedVia: string
}

export type SingleDishConstraintResult = {
  level: DishConstraintLevel
  matches: DishConstraintMatch[]
  primaryReason: string | null
}

function dishSearchText(dish: ParsedMenuDish): string[] {
  const parts = [
    dish.name,
    dish.description ?? '',
    dish.cookingMethod ?? '',
    ...dish.listedIngredients,
    ...dish.modifiers,
  ]
  return parts.map((p) => p.toLowerCase())
}

function textContains(haystack: string[], needle: string): string | null {
  const n = needle.toLowerCase()
  for (const part of haystack) {
    if (part.includes(n)) return part
  }
  return null
}

export async function checkDishConstraints(
  dish: ParsedMenuDish,
  db: DrizzleDB,
): Promise<SingleDishConstraintResult> {
  const activeConstraints = db
    .select()
    .from(constraints)
    .where(and(eq(constraints.status, 'confirmed')))
    .all()

  const haystack = dishSearchText(dish)
  const matches: DishConstraintMatch[] = []

  for (const c of activeConstraints) {
    const hit = textContains(haystack, c.entityValue)
    if (!hit) continue

    const severity = c.constraintType === 'hard_allergy' ? 'hard' : 'soft'
    matches.push({
      constraintType: c.constraintType,
      entityValue: c.entityValue,
      severity,
      matchedVia: hit,
    })
  }

  const hardBlock = matches.find(
    (m) => m.constraintType === 'hard_allergy' || m.constraintType === 'dietary_identity',
  )
  if (hardBlock) {
    return {
      level: 'block',
      matches,
      primaryReason: `Menu text mentions ${hardBlock.entityValue}.`,
    }
  }

  const intolerance = matches.find((m) => m.constraintType === 'intolerance')
  if (intolerance) {
    return {
      level: 'warn',
      matches,
      primaryReason: `Possible ${intolerance.entityValue} conflict — ask to confirm.`,
    }
  }

  const dislike = matches.find((m) => m.constraintType === 'dislike')
  if (dislike) {
    return {
      level: 'deprioritize',
      matches,
      primaryReason: `Contains ${dislike.entityValue}, which you prefer to avoid.`,
    }
  }

  return { level: 'clear', matches, primaryReason: null }
}

export async function checkDishConstraintsBatch(
  dishes: ParsedMenuDish[],
  db: DrizzleDB,
): Promise<Record<string, SingleDishConstraintResult>> {
  const out: Record<string, SingleDishConstraintResult> = {}
  for (const dish of dishes) {
    out[dish.id] = await checkDishConstraints(dish, db)
  }
  return out
}
```

**Note:** Production should use shared synonym expansion from Supabase `ingredient_synonyms` (**07**/**23**) — stub uses direct text match.
