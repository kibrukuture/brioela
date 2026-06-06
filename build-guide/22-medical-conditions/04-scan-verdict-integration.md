# Medical Conditions — Scan Verdict Integration

## What This File Covers

How active medical conditions change product scan results: separate condition rows, severity mapping, rule evaluation, low-confidence behavior, and copy boundaries.

---

## UI Rule

Condition flags are separate from allergy/constraint flags.

Display order:

1. Hard allergy/safety block.
2. Standard scan verdict.
3. Condition flag rows.
4. Expanded product details.

This prevents confusion between "contains my allergen" and "not ideal for my condition."

---

## Condition Flag Result

```typescript
type ConditionFlagResult = {
  conditionType: MedicalConditionType
  flagLevel: "hard" | "soft" | "info"
  matchedRuleIds: string[]
  trigger: string
  reason: string
  confidence: number
}

type ScanConditionEvaluation = {
  scanEventId: string
  userId: string
  conditionFlags: ConditionFlagResult[]
}
```

The main `VerdictSchema` can be extended with a `conditionFlags` array, or condition rows can be returned as a parallel payload. Keep them visually distinct.

---

## Examples

Pregnancy:

```text
Pregnancy flag: unpasteurized cheese may carry listeria risk.
```

Hypertension:

```text
Hypertension flag: high sodium for a single serving.
```

Warfarin:

```text
Blood thinner note: this is high in vitamin K. Consistency matters more than avoiding it completely.
```

Celiac:

```text
Celiac flag: contains wheat. Avoid.
```

---

## Hard Conditions

Treat these as hard when matching explicit triggers:

- celiac + gluten source or cross-contamination warning
- PKU + phenylalanine/aspartame trigger
- pregnancy + explicit high-risk foods from rule config

Hard condition flags produce red condition rows. They do not erase the standard scan verdict, but they can make the product effectively not recommended for the user.

---

## Low Confidence Product Data

If product data is OCR-derived or incomplete, condition evaluation must show uncertainty.

Example:

```text
Condition check incomplete: label data may be missing ingredients relevant to celiac.
```

Do not show a clean condition pass when ingredient data is incomplete for an active hard condition.

---

## Copy Boundaries

Allowed:

- "Flagged for pregnancy guidelines."
- "High sodium may not fit your hypertension profile."
- "Contains wheat, which conflicts with your celiac profile."

Blocked:

- "This will harm your baby."
- "This treats hypertension."
- "This food is forbidden by your doctor."
- "This proves your condition is worse."

Keep copy practical and food-specific.

---

## Event Logging

Log condition flag events privately:

```typescript
type ConditionFlagEvent = {
  eventId: string
  userId: string
  entityKind: "scan" | "recipe" | "menu_dish"
  entityId: string
  conditionType: MedicalConditionType
  flagLevel: "hard" | "soft" | "info"
  flagReason: string
  ruleVersion: string
  createdAt: number
}
```

Do not write these events to shared community data.
