# Passport — Privacy And Consent

## What This File Covers

Privacy minimization, sensitive field redaction, consent levels, medical boundaries, and what Passport must never reveal by default.

---

## Core Rule

Passport says only what the recipient needs to know.

It never exports the user's private Brioela brain.

---

## Excluded By Default

- child names
- Mesa member names
- exact medical condition names when food-rule wording is enough
- practitioner/client relationship details
- wearable/glucose data
- full allergy profile
- full scan history
- exact home location
- private notes

---

## Consent Levels

```typescript
type PassportConsentLevel =
  | "preview_confirmed"
  | "include_sensitive_detail"
  | "translated_preview_confirmed"
```

Most Passports require `preview_confirmed`.

Sensitive details require `include_sensitive_detail`.

Translated Passports require translated preview confirmation when possible.

---

## Safe Rewrites

Use:

```text
One person at this table avoids gluten strictly.
```

Avoid by default:

```text
My child Noah has celiac disease.
```

Use:

```text
Please avoid peanuts and peanut oil.
```

Avoid by default:

```text
My daughter has a life-threatening peanut allergy.
```

---

## Medical Boundary

Passport can communicate food instructions.

Allowed:

- avoid ingredient
- ask preparation question
- cross-contact warning
- food consistency note

Blocked:

- diagnosis
- treatment
- medication dosing
- emergency medical protocol
- "this restaurant/product is medically safe"

---

## Link Privacy

QR/link Passports:

- expire
- can be revoked
- use unguessable token
- show only Passport content, not account state
- do not expose user dashboard or profile
