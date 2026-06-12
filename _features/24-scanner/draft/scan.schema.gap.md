# Gap snapshot: scan.schema.ts

Target: `shared/validator/scan.schema.ts`

**Status:** Not in repo. Authoritative contract from `build-guide/07-scanner/01-barcode-decode.md` + `04-scan-result-ui.md` + **23** `conditionFlags` extension.

---

```typescript
import { z } from 'zod'

export const CreateScanInputSchema = z.object({
  upc: z.string().min(4).max(20),
  rawScanType: z.string(),
  geoHash: z.string().length(6).nullable(),
  capturedAt: z.number().int().positive(),
})

export type CreateScanInput = z.infer<typeof CreateScanInputSchema>

export const ConstraintLevelSchema = z.enum([
  'block',
  'boycott',
  'warn',
  'deprioritize',
  'clear',
  'guardrails_unavailable',
])

export const ConstraintMatchSchema = z.object({
  constraintId: z.string(),
  constraintType: z.string(),
  entityValue: z.string(),
  matchedVia: z.string(),
  severity: ConstraintLevelSchema,
})

export const MedicationFoodInteractionSchema = z.object({
  medication: z.string(),
  ingredient: z.string(),
  interaction: z.string(),
  severity: z.enum(['high', 'moderate', 'note']),
})

export const CommunityHealthAssociationSchema = z.object({
  ingredientName: z.string(),
  reportedConditionTag: z.string(),
  postExposureEventKind: z.string(),
  eventAssociationScore: z.number(),
  supportingHealthGroupCount: z.number(),
  plainLanguageAssociationSummary: z.string(),
  severity: z.enum(['warn', 'deprioritize']),
})

export const ConditionFlagResultSchema = z.object({
  conditionType: z.string(),
  flagLevel: z.enum(['hard', 'soft', 'info']),
  matchedRuleIds: z.array(z.string()),
  trigger: z.string(),
  reason: z.string(),
  confidence: z.number(),
})

export const VerdictTraceStepSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('product_identity_resolved'), productId: z.string(), confidence: z.number() }),
  z.object({ kind: z.literal('fact_snapshot_built'), approvedForSafetyDecisions: z.boolean(), evidenceCount: z.number() }),
  z.object({ kind: z.literal('base_score_computed'), score: z.number(), drivers: z.array(z.string()) }),
  z.object({ kind: z.literal('hard_constraint_checked'), matched: z.boolean(), matchCount: z.number() }),
  z.object({ kind: z.literal('medication_food_checked'), severity: z.enum(['none', 'note', 'warn', 'block']) }),
  z.object({ kind: z.literal('community_association_checked'), applied: z.boolean(), strongestScore: z.number().nullable() }),
  z.object({ kind: z.literal('origin_context_attached'), boycottMatched: z.boolean() }),
  z.object({ kind: z.literal('condition_flags_checked'), flagCount: z.number() }),
  z.object({ kind: z.literal('guardrails_unavailable'), reason: z.string() }),
  z.object({ kind: z.literal('final_verdict_built'), level: z.enum(['green', 'yellow', 'red']), reason: z.string() }),
])

export const VerdictSchema = z.object({
  level: z.enum(['green', 'yellow', 'red']),
  reason: z.string().max(120),
  score: z.number().min(0).max(100),
  constraint: z
    .object({
      level: ConstraintLevelSchema,
      matches: z.array(ConstraintMatchSchema),
      medicationFoodInteractions: z.array(MedicationFoodInteractionSchema),
      communityHealthAssociations: z.array(CommunityHealthAssociationSchema),
    })
    .nullable(),
  conditionFlags: z.array(ConditionFlagResultSchema),
  communityHealth: z
    .object({
      confidenceScore: z.number().min(0).max(1),
      evidenceVolumeScore: z.number().min(0).max(1),
      disagreementScore: z.number().min(0).max(1),
      reportedEventRate: z.number().nullable(),
      elevatedConditionTags: z.array(z.string()),
    })
    .nullable(),
  origin: z
    .object({
      country: z.string().nullable(),
      parentCompany: z.string().nullable(),
      boycottActive: z.boolean(),
    })
    .nullable(),
  expandedDetail: z.object({
    nutrients: z.record(z.number()),
    additives: z.array(z.string()),
    ingredients: z.array(z.string()),
    sourceRefs: z.array(z.object({ source: z.string(), id: z.string() })),
    confidence: z.number(),
  }),
  trace: z.array(VerdictTraceStepSchema),
})

export type Verdict = z.infer<typeof VerdictSchema>
```

**Note:** `conditionFlags` owned by **23** evaluation; **24** merges into verdict assembly.
