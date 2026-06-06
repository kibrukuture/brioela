# Viral Sharing — Discovery Card System

## What This File Covers

Discovery Card structure, rendering, templates, attribution, CTAs, and visual rules.

---

## Core Rule

Discovery Cards are evidence cards.

They should show:

- what was discovered
- why it matters
- enough context to be useful
- tasteful Brioela attribution

They should not look like ads.

---

## Card Shape

```typescript
type DiscoveryCard = {
  cardId: string
  cardType: DiscoveryCardType
  title: string
  finding: string
  contextLine: string | null
  visualEntity: {
    kind: "product" | "recipe" | "place" | "menu" | "generic"
    name: string
    imageUrl: string | null
  }
  attribution: string
  cta: string | null
  privacyLevel: "public_safe" | "reviewed_sensitive"
}
```

Card types:

```typescript
type DiscoveryCardType =
  | "scan_discovery"
  | "swap"
  | "kids_learning"
  | "mesa_compatibility"
  | "menu_reality"
  | "recipe_preservation"
  | "creator_recipe"
  | "cook_together"
  | "savings"
  | "ground_find"
  | "personal_response"
```

---

## Rendering

Use the design system. Cards should be generated as static images for cross-platform sharing.

Rules:

- one central finding
- one supporting context line max
- no dense tables
- no private detail dump
- accessible contrast
- product/recipe/place visual when useful
- Brioela attribution small but visible
- avoid fear graphics unless user explicitly chooses safety-share context

---

## CTA

CTA should be quiet and contextual.

Examples:

- "Scanned with Brioela"
- "Cooked with Brioela"
- "Saved to Brioela"
- "Found with Brioela"

Avoid:

- "Download now"
- "Use my referral code"
- "Join today"
- "This app changed my life"

The card's content should create curiosity by itself.

---

## Generation Flow

1. Feature emits `BrioelaMoment`.
2. Moment score decides whether to offer share.
3. Privacy scrub runs.
4. User reviews card preview.
5. User shares or dismisses.

Do not auto-share. Do not auto-open share sheet before preview.
