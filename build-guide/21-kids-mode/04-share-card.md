# Kids Mode — Share Card

## What This File Covers

The Kids Mode share card: content, visual boundary, privacy rules, and how it supports organic parent-to-parent sharing without becoming an ad.

---

## Product Rule

The share card is a parenting moment.

It should feel like:

```text
We learned this together.
```

Not:

```text
Download this app.
```

---

## Card Content

```typescript
type KidsShareCard = {
  scanEventId: string
  productName: string
  productImageUrl: string | null
  verdictSentence: string
  coolFact: string
  ageRange: "5-7" | "8-10" | "11-12"
  attribution: "we scanned this together with Brioela"
}
```

Do not include:

- child's name
- parent name
- exact location
- private allergy profile
- full ingredient list
- medical data

If a hard allergy warning is involved, use the safe public wording from `05-safety-and-tier-boundary.md`.

---

## Visual Direction

Use the existing design system:

- bright, clean card
- simple product visual
- one verdict sentence
- one cool fact
- Brioela attribution small and tasteful
- no dense nutrition table
- no fear-based warning graphics unless hard safety requires it

The card should be readable in family group chats and social screenshots.

---

## Share Flow

After a Kids Mode explanation:

```text
Share this learning moment?
```

Actions:

- Share card
- Save image
- Not now

Do not auto-open share UI. The parent chooses.

---

## Safety Share Boundary

If hard allergy matched, the card can say:

```text
We learned this food is not for our family because it contains an ingredient we avoid for safety.
```

Avoid:

```text
My child is allergic to peanuts.
```

The card teaches without exposing private health details.

---

## Growth Boundary

Share card metrics matter, but the product should not pressure sharing.

Allowed:

- share button after explanation
- tasteful attribution
- useful educational content

Blocked:

- referral prompts on the card
- gamified parent streaks
- child faces/photos by default
- public ranking of parents or kids

The share works because it is useful and sweet, not because it is engineered as an ad.
