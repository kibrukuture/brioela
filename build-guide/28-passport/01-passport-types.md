# Passport — Passport Types

## What This File Covers

The Passport kinds, who receives them, what they are for, and what problem each one solves.

---

## Core Rule

Passport is scoped to a real-world handoff.

It is not a generic export of the user's food profile.

---

## Passport Kinds

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

---

## Personal Food Safety

For one user communicating active food safety rules.

Examples:

- allergy restaurant handoff
- celiac cross-contact explanation
- Warfarin/vitamin K consistency note

---

## Mesa Table

For multiple people eating together.

Examples:

- restaurant table with several dietary needs
- family dinner at someone else's home
- group menu selection

Mesa Passport should use generic labels by default:

```text
One person at this table avoids gluten strictly.
```

not:

```text
Noah has celiac.
```

---

## Restaurant Menu

Generated from menu scanning yellow/red results.

Primary output:

- avoid lines
- ask lines
- shared preparation questions
- sauce/marinade/broth questions

---

## Bela Shopper

Generated for a Bela order or substitution flow.

Primary output:

- substitution rules
- scan-before-buy rules
- hard avoid rules
- uncertainty instructions

---

## Caregiver / School

For child, elder, or caregiver handoff.

Rules:

- no child name by default
- no full medical details by default
- clear snack/meal rules
- parent contact/action instruction if needed

---

## Travel Translation

For travel and language barriers.

Rules:

- generated from confirmed rules only
- translated into target language
- ingredient/preparation questions preferred over medical language

---

## Practitioner Guidance

For user-approved practitioner food notes.

Rules:

- practitioner relationship details hidden by default
- note must be user-approved
- no diagnosis/treatment language
