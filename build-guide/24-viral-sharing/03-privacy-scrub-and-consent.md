# Viral Sharing — Privacy Scrub And Consent

## What This File Covers

The privacy/safety filter every Discovery Card must pass before rendering or sharing.

---

## Core Rule

No share card is generated directly from raw product state.

Every card goes through privacy scrub first.

---

## Blocked By Default

Never include by default:

- allergies
- medical conditions
- child identity
- exact location
- private Mesa member names
- practitioner/client data
- wearable/glucose data
- private notes
- raw receipts
- account/user names unless explicitly chosen

---

## Scrub Result

```typescript
type PrivacyScrubResult = {
  allowed: boolean
  sensitivity: "public_safe" | "needs_user_review" | "blocked"
  redactions: Array<{
    field: string
    reason: string
  }>
  requiresExplicitConsent: boolean
  safePayload: Record<string, unknown>
}
```

If `blocked`, no card is produced.

If `needs_user_review`, show preview with sensitive fields removed or generalized.

---

## Sensitive Examples

Allergy:

- Default blocked: "My child is allergic to peanuts."
- Safe rewrite: "We learned this food is not for our family because it contains an ingredient we avoid for safety."

Medical:

- Default blocked: "This is bad for my diabetes."
- Safe rewrite only with consent: "I learned this food does not fit my personal food profile."

Mesa:

- Default blocked: "Bad for Sarah and Grandma."
- Safe rewrite: "This dinner works for everyone at our table."

Glucose:

- Default blocked.
- Explicit opt-in only: "I learned this snack spikes me more than I expected."

---

## Consent Levels

```typescript
type ShareConsentLevel = "none" | "preview_confirmed" | "explicit_sensitive_opt_in"
```

Most cards require `preview_confirmed`.

Sensitive cards require `explicit_sensitive_opt_in` and should be rare.

---

## Business Safety

Do not create a negative public accusation against a business from one uncertain scan/menu event.

Allowed:

```text
I scanned the menu. Only 2 dishes fit my profile.
```

Blocked:

```text
This restaurant is unsafe.
```

Unless there is a verified recall/public health issue, keep business-facing share language personal and factual.
