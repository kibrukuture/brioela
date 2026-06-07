# Kids Mode — Scan Explanation

## What This File Covers

The scan-result flow that generates a child-friendly explanation after the normal adult verdict has already been computed.

---

## Core Rule

Kids Mode augments the scan verdict. It never replaces it.

The standard scanner pipeline runs first:

1. barcode or GPT-4o mini vision extraction resolution
2. product data confidence
3. user constraint check
4. adult scan verdict
5. hard allergy/safety display if needed

Only then can Kids Mode generate a child-friendly explanation.

---

## Trigger

On scan result screen, show:

```text
Explain to my kid
```

Rules:

- Show after the standard verdict is available.
- If hard allergy block is present, keep safety block above Kids Mode.
- If product data confidence is low, include a caveat in the explanation.
- If user is not entitled, show teaser/upgrade behavior from `05-safety-and-tier-boundary.md`.

---

## Three-Part Format

Every explanation has exactly three parts:

1. Verdict in one sentence.
2. Why in two sentences.
3. One cool food fact.

```typescript
type KidsScanExplanation = {
  scanEventId: string
  ageRange: "5-7" | "8-10" | "11-12"
  verdictSentence: string
  whySentences: [string, string]
  coolFact: string
  sourceConfidence: number
  safetyContext: "none" | "allergy_warning" | "low_confidence" | "both"
}
```

The cool fact may be broader food science, but it must connect to the product, ingredient, color, sugar, additive, fiber, protein, or origin context.

---

## Prompt Inputs

The secondary LLM call receives:

- product name
- scan verdict level and reason
- key ingredients/additives/nutrients
- source confidence
- hard allergy/constraint status
- age range

It does not receive unrelated user memory. It does not need the full user profile.

---

## Prompt Rules

The prompt must say:

- explain to a child in the target age range
- do not contradict the adult verdict
- do not hide allergy or safety warnings
- do not shame the child or parent
- do not say food is "bad" as a moral judgment
- use concrete analogies for younger ranges
- keep output short
- return JSON matching `KidsScanExplanation`

---

## Age Examples

For `5-7`:

```text
This snack has lots of sugar, so it is more of a sometimes treat.
Sugar gives quick energy, but too much can make your body feel wiggly and tired later. Your body likes snacks with more fiber because they help energy last longer.
Cool fact: Fiber is like a tiny broom that helps food move through your belly.
```

For `8-10`:

```text
This cereal is not the best everyday choice because it has a lot of added sugar.
Added sugar means sugar put in by the company, not sugar that naturally comes from fruit. Too much added sugar can give quick energy and then a crash.
Cool fact: Ingredient lists are ordered by amount, so the first ingredients are what the food has most.
```

For `11-12`:

```text
This drink is a yellow choice because it has a lot of added sugar and very little fiber.
Sugar absorbs quickly when there is not much fiber, protein, or fat to slow it down. That can make it less useful as an everyday drink.
Cool fact: Fiber can slow digestion, which is one reason whole fruit affects the body differently than fruit juice.
```

---

## Output Boundary

Kids explanations should teach, not scare.

Avoid:

- "This will make you sick."
- "This food is poison."
- "Good kids do not eat this."
- "Your parent should never buy this."

Use:

- "sometimes treat"
- "everyday choice"
- "your body usually likes..."
- "ask a grown-up if you have an allergy"
