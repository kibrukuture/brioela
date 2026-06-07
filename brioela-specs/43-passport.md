# 43. Passport

## Goal

Let a Brioela user generate a temporary, privacy-safe food instruction artifact they can show or send to another human when food needs must be understood clearly. Passport is not a social share card. It is a real-world handoff object for waiters, shoppers, caregivers, schools, hosts, travel, practitioners, and anyone responsible for preparing or choosing food.

## Why This Exists

Food safety often fails at the handoff. The user knows their needs. Brioela knows their constraints. But the waiter, shopper, school staff, caregiver, friend, or family member may misunderstand, forget, minimize, or lack the language to ask the right question.

Passport turns Brioela's private intelligence into a minimal, temporary, human-readable instruction card.

It answers:

```text
What does this person or table need another human to know right now?
```

## Product Boundary

Passport is action infrastructure, not viral sharing.

- Discovery Cards share what Brioela found.
- Passport communicates what must be respected.

Passport is not public by default. It is user-generated, scoped, revocable, and privacy-scrubbed.

## User Outcomes

- User scans a restaurant menu and generates a Passport for staff.
- User creates a Mesa Passport for everyone eating at a table.
- User sends a Passport to a Bela shopper for substitution rules.
- Parent creates a school/caregiver snack Passport for a child without exposing unnecessary details.
- Traveler generates a translated Passport for local restaurants.
- Practitioner guidance can appear as user-approved wording if the user has granted consent.

## Passport Types

```typescript
type PassportKind =
  | "personal_food_safety"
  | "mesa_table"
  | "restaurant_menu"
  | "bela_shopper"
  | "caregiver_school"
  | "travel_translation"
  | "practitioner_guidance"
```

## Passport Shape

```typescript
type Passport = {
  passportId: string
  userId: string
  kind: PassportKind
  audience: "self" | "mesa" | "selected_members" | "guest_session"
  title: string
  instructionBlocks: PassportInstructionBlock[]
  language: string
  expiresAt: number
  revokedAt: number | null
  shareMode: "show_on_screen" | "image" | "pdf" | "qr_link" | "text"
  sensitivity: "public_safe" | "limited_sensitive" | "blocked"
  createdAt: number
}

type PassportInstructionBlock = {
  heading: string
  lines: string[]
  severity: "info" | "ask" | "avoid" | "critical"
}
```

## Examples

Restaurant:

```text
Passport

For this meal:
- Avoid peanuts and peanut oil.
- Please confirm sauces and marinades.
- Please confirm shared fryer/contact with peanuts.

Question to ask:
Does this dish contain peanuts, peanut oil, or is it prepared near peanuts?

Expires tonight.
```

Mesa:

```text
Passport

For this table:
- One person avoids gluten strictly.
- One person has a peanut allergy.
- One person is vegetarian.

Please confirm:
- shared fryer
- sauce ingredients
- meat stock in vegetarian dishes

Expires tonight.
```

Bela:

```text
Passport

Mesa order rules:
- No peanut products.
- Use certified gluten-free substitutions only.
- If uncertain, scan replacement before buying.
```

Travel:

```text
Passport

I have celiac disease.
Please avoid wheat, barley, rye, and shared fryer preparation.
```

## Data Sources

Passport can draw from:

- confirmed user constraints
- active medical condition food rules
- Mesa active audience
- guest session constraints
- menu scanning waiter questions
- Bela order constraints
- travel destination language hints
- practitioner annotations explicitly approved by the user

Passport never includes private data just because Brioela knows it. Every included line must be necessary for the handoff.

## Privacy Rules

Default exclusions:

- child names
- exact medical condition names when a food-rule wording is enough
- full allergy profile if only one risk matters
- private Mesa member names
- practitioner/client relationship details
- wearable/glucose data
- private notes
- exact home location
- full scan history

Names and sensitive details require explicit user inclusion.

## Expiration And Revocation

Every Passport expires.

Default expiration:

- restaurant/menu: same day
- Bela shopper: order completion
- travel translation: trip context or user-chosen duration
- caregiver/school: user-chosen duration
- practitioner guidance: until revoked or condition annotation changes

User can revoke any active Passport immediately.

## Translation

Passport can be translated for travel or local restaurant use.

Translation rules:

- preserve food-safety meaning over literal wording
- show source language and translated language when useful
- avoid medical jargon where ingredient questions are enough
- never translate hidden extra information not present in the original Passport

## Non-Medical Boundary

Passport communicates food rules. It does not diagnose, treat, prescribe, or replace clinician advice.

Blocked:

- medication dosing
- diagnosis statements
- emergency medical instructions
- claims that a restaurant/product is medically safe

Allowed:

- ingredient avoidance
- preparation questions
- cross-contact questions
- user-approved practitioner food notes

## Success Metrics

- Passport generation rate after menu scans.
- Passport use in Bela orders.
- Passport translation use while traveling.
- User-reported usefulness after restaurants/caregiver handoffs.
- Reduction in repeated manual waiter-question taps when Passport is used.
