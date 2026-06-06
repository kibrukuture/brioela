# Viral Sharing — Shareable Moment Taxonomy

## What This File Covers

The taxonomy of Brioela Moments: which product events can become shareable Discovery Cards and which events must never be shared.

---

## Product Rule

Share the discovery, not the app.

The user should be sharing something Brioela revealed, preserved, compared, or made understandable. The card should look like useful information, not a banner ad.

---

## Brioela Moment

```typescript
type BrioelaMoment = {
  momentId: string
  kind: MomentKind
  sourceFeature: "scanner" | "kids_mode" | "mesa" | "menu_scanning" | "recipe_ingestion" | "cooking_session" | "receipt" | "ground" | "wearables"
  entityKind: "product" | "recipe" | "restaurant" | "menu" | "place" | "meal_plan" | "scan" | "find"
  entityId: string
  suggestedCardType: DiscoveryCardType
  sensitivity: "public_safe" | "needs_review" | "sensitive" | "blocked"
  createdAt: number
}
```

Moment types:

- scan discovery
- ingredient surprise
- healthier swap
- kids learning moment
- Mesa compatibility moment
- menu reality moment
- creator recipe attribution
- grandma/generational recipe preservation
- cook-together moment
- savings/receipt moment
- Ground local discovery
- personal glucose response, opt-in only

---

## Good Share Triggers

Good triggers are specific and useful:

- surprising additive or ingredient
- sugar/sodium/fiber insight
- unexpected country of origin or parent company
- safer swap found
- recipe preserved from family cooking
- restaurant menu had limited safe options
- Mesa found a meal that works for everyone
- kid learned a label-reading fact
- verified creator recipe cooked/adapted
- price/savings result

---

## Bad Share Triggers

Do not generate cards for:

- normal green scan with nothing interesting
- fear-only allergy warning by default
- medical condition details
- child identity
- private Mesa member names
- practitioner/client relationships
- raw wearable or glucose data
- exact home location
- shame-based eating patterns
- negative business targeting from one low-confidence signal

---

## Moment Threshold

A share card should be suggested only when the moment is strong enough.

```typescript
type ShareMomentScore = {
  surprise: number
  usefulness: number
  emotionalWeight: number
  privacyRisk: number
  confidence: number
  finalScore: number
}
```

Share prompt only if:

- final score is high enough
- confidence is high enough
- privacy risk is low or user explicitly reviews
- card passes privacy scrub

This prevents Brioela from becoming noisy.
