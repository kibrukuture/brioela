# Gap snapshot: check-constraint.ts (Brain DO)

Target: `tools/product-scan/check-constraint.ts`

**Status:** Not in repo. **07** owns matching logic; runs inside Brain DO. From `build-guide/07-scanner/03-constraint-check.md`.

---

```typescript
import { eq, and } from 'drizzle-orm'
import type { DrizzleDB } from '@/types/db'
import { constraints } from '@/agents/brain/_schemas/constraint.schema'
import { medications as medicationsTable } from '@/agents/brain/_schemas/medications.schema'
import type { ResolvedProductFactSnapshot } from '@brioela/shared/validator/product'

export type ConstraintLevel =
  | 'block'
  | 'boycott'
  | 'warn'
  | 'deprioritize'
  | 'clear'
  | 'guardrails_unavailable'

export interface ConstraintCheckResult {
  level: ConstraintLevel
  matches: ConstraintMatch[]
  medicationFoodInteractions: MedicationFoodInteraction[]
  communityHealthAssociations: CommunityHealthAssociation[]
}

export async function checkProductConstraints(
  product: ResolvedProductFactSnapshot,
  db: DrizzleDB,
  env: Env,
): Promise<ConstraintCheckResult> {
  const matches: ConstraintMatch[] = []
  const medicationFoodInteractions: MedicationFoodInteraction[] = []
  const communityHealthAssociations: CommunityHealthAssociation[] = []

  const activeConstraints = db
    .select()
    .from(constraints)
    .where(and(eq(constraints.status, 'confirmed')))
    .all()

  const productIngredients = (product.ingredients ?? []).map((i) => i.toLowerCase())
  const productBrand = (product.brand ?? '').toLowerCase()
  const productAdditives = product.additives ?? []

  for (const constraint of activeConstraints) {
    // hard_allergy | intolerance | dislike | dietary_identity | boycott switches
    // ingredientMatches() with Supabase-cached INGREDIENT_SYNONYMS
  }

  const medications = db
    .select()
    .from(medicationsTable)
    .where(and(eq(medicationsTable.active, 1)))
    .all()

  if (medications.length > 0) {
    medicationFoodInteractions.push(
      ...checkMedicationFoodInteractions(
        medications.map((m) => m.medicationCategory),
        productIngredients,
      ),
    )
  }

  // Community overlay: Redis fetchIngredientEventAssociationSignals — NOT live Supabase join
  // Use opt-in cohort tags from **22** — NOT clinical profiles from **23**

  const severityOrder: ConstraintLevel[] = ['block', 'boycott', 'warn', 'deprioritize', 'clear']
  const highestSeverity =
    matches.length === 0
      ? medicationFoodInteractions.some((d) => d.severity === 'high') ||
          communityHealthAssociations.some((a) => a.severity === 'warn')
        ? 'warn'
        : 'clear'
      : (severityOrder.find((s) => matches.some((m) => m.severity === s)) ?? 'clear')

  matches.sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  )

  return { level: highestSeverity, matches, medicationFoodInteractions, communityHealthAssociations }
}
```

**Fix at implementation:** Replace draft `getUserConditionTags(db)` from `user_memory` with **22** opt-in cohort tag resolver — separate from **23** clinical profiles.
