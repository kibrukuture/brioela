# Medical Conditions — Condition Rule Config

## What This File Covers

The versioned rule configuration that maps medical conditions to food flags, ingredients, nutrients, preparation risks, severity, and copy.

---

## Core Rule

Condition rules are not hardcoded in Brain DO logic.

Rules live in versioned Supabase configuration and are cached by the backend. This allows updates without code deploy when guidance changes or rule quality improves.

---

## Rule Tables

```typescript
type ConditionRule = {
  ruleId: string
  conditionType: MedicalConditionType
  ruleVersion: string
  triggerKind: "ingredient" | "nutrient" | "additive" | "category" | "preparation" | "drug_interaction"
  triggerValue: string
  flagLevel: "hard" | "soft" | "info"
  strictness: "strict" | "moderate" | "standard" | "all"
  reasonTemplate: string
  evidenceSource: string | null
  active: boolean
  updatedAt: number
}

type MedicationFoodInteractionRule = {
  ruleId: string
  medicationClass: string
  triggerKind: "ingredient" | "category" | "nutrient"
  triggerValue: string
  flagLevel: "hard" | "soft" | "info"
  reasonTemplate: string
  active: boolean
  updatedAt: number
}
```

The spec names `condition_rule` and `medication_food_interaction_rule`; implementation can use those table names.

---

## Severity Model

| Level | Meaning | UI behavior |
|---|---|---|
| `hard` | avoid / strong incompatibility | red condition row, may hide recipe by default |
| `soft` | caution / limit / ask / rank lower | yellow condition row, show reason |
| `info` | educational context | neutral info row or expanded detail only |

Examples:

- Celiac + gluten source → `hard`.
- PKU + aspartame/phenylalanine source → `hard`.
- Pregnancy + unpasteurized cheese → `hard`.
- Hypertension + high sodium → `soft` unless extreme threshold.
- Warfarin + high vitamin K → `info` or `soft` consistency note, not automatic avoid.

---

## Rule Evaluation Inputs

Rules can evaluate:

- normalized ingredients
- ingredient synonyms
- additives
- nutrients per serving/per 100g
- product categories
- preparation terms like raw, unpasteurized, deli, smoked, cured, shared fryer
- recipe ingredients and steps
- menu parsed dish descriptions

If the source data is incomplete, return caution, not false safety.

---

## Versioning

Every active condition profile stores the rule version used.

When rule versions update:

- new scans use current active version
- existing scan history does not need retroactive rewrite by default
- user-facing condition detail can say rules were updated
- if a rule change materially changes safety behavior, consider an in-app notice, not a marketing push

---

## Review Boundary

Condition rules need a review process before production use.

Minimum rule metadata:

- evidence source or clinical guideline source
- reviewer or review process marker
- updated date
- condition type
- severity rationale

Brioela should not silently create medical condition rules from an LLM. LLM can help draft rule candidates for human review, but active rules must come from reviewed config.

---

## Cache Strategy

Backend can cache active rules by version.

Rules:

- cache key includes `conditionType` and `ruleVersion`
- short enough TTL to receive rule updates promptly
- if rule fetch fails, fail safe for active hard conditions where possible by returning caution/unknown rather than green
- log rule fetch failures for investigation
