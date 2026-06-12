# Production snapshot: constraint.schema.ts (07 boundary — not 23)

Target: `backend/src/agents/brain/_schemas/constraint.schema.ts`

**Status:** Shipped schema only (**07-brain-constraint-tools**). Tools not shipped. Medical conditions use a **separate** table and UI rows.

---

## Why this file is in 23 draft folder

Documents the **07 vs 23** boundary. Constraints handle allergies/intolerances/dislikes/identity/boycotts — not clinical condition profiles.

| | **07 `constraints`** | **23 `medical_condition_profiles`** |
|---|---|---|
| Examples | Peanut allergy, vegan, Nestlé boycott | Celiac, pregnancy, PKU, hypertension |
| Confirmation | propose → confirm tool | propose → confirm medical condition tool |
| Scan UI | `verdict.constraint.matches` | `verdict.conditionFlags[]` |
| Rules | Ingredient/brand entity match | Supabase `condition_rule` versioned config |
| Hard block | `hard_allergy`, `dietary_identity` | `flagLevel: 'hard'` on condition rules |

## Shipped enums (excerpt)

```typescript
const constraintKind = ['hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott'] as const
const constraintStatus = ['proposed', 'confirmed', 'auto_confirmed', 'rejected'] as const
```

**Celiac overlap:** User may have both `hard_allergy` for gluten (**07**) and `celiac` condition profile (**23**). UI shows separate rows — do not dedupe.
