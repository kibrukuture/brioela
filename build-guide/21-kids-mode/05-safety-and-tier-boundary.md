# Kids Mode — Safety And Tier Boundary

## What This File Covers

How Kids Mode respects scan safety, hard allergy warnings, low-confidence product data, and Core tier gating without weakening the free scanner.

---

## Safety Always Comes First

Kids Mode never hides or softens the adult safety verdict.

If standard scan shows a hard allergy block, the display order is:

1. Hard allergy block from Scanner.
2. Parent acknowledgement if required by Scanner.
3. Kids Mode explanation below, if parent chooses.

Kids Mode cannot appear above the safety block.

---

## Hard Allergy Copy

Adult-facing block stays exact:

```text
Contains peanuts - your listed allergy.
```

Kid explanation can simplify only after that:

```text
This food has peanuts. Some people's bodies react badly to peanuts, so in our family this is a food to avoid.
```

Do not say:

```text
This is scary.
```

Do not say:

```text
This will hurt you.
```

Unless the parent profile explicitly requires stronger language, keep the child copy calm and accurate.

---

## Low Confidence Product Data

If scan/OCR confidence is low, Kids Mode must include that uncertainty.

Example:

```text
I could not read every word on this label, so we should check with a grown-up before deciding.
```

Do not produce a confident child explanation from uncertain product data.

---

## Tier Boundary

Scanning and hard allergy safety are always free.

Kids Mode is Core tier and above.

Free tier behavior:

- Show the "Explain to my kid" entry point.
- Show one short teaser line.
- Prompt upgrade inline.
- Do not hide the scan verdict or allergy warning.

Example:

```text
Kids Mode turns scan results into simple explanations for children. Upgrade to use it on every scan.
```

Upgrade prompt must not appear before the standard free scan verdict.

---

## Entitlement Check

```typescript
type KidsModeEntitlement = {
  allowed: boolean
  tier: "free" | "core" | "chef" | "power" | "b2b"
  reason: "allowed" | "requires_core"
}
```

The feature should call the pricing tier check when the parent taps Kids Mode, not during the standard scan.

---

## Medical Boundary

Kids Mode can explain food labels, sugar, additives, allergens, and general food concepts.

It cannot diagnose or give medical advice.

Allowed:

- "This contains peanuts, and your family avoids peanuts for safety."
- "This has a lot of added sugar."
- "This is more of a sometimes snack."

Blocked:

- "This causes ADHD."
- "This will make you sick."
- "This treats your condition."
- "You should never eat this again."

The parent remains the decision-maker.
