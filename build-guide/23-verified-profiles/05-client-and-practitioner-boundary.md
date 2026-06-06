# Verified Profiles — Client And Practitioner Boundary

## What This File Covers

Consent-based practitioner-client relationships, condition annotations, scope control, revocation, and medical boundaries.

---

## Core Rule

Practitioner access is user-granted, scoped, and revocable.

No practitioner can view client medical condition data or scan history just because they are verified.

---

## Relationship Flow

1. Practitioner sends invite or user requests connection.
2. User sees exact requested access scope.
3. User accepts or rejects.
4. Practitioner can act only inside granted scope.
5. User can revoke anytime.

---

## Scope Shape

```typescript
type PractitionerClientScope = {
  relationshipId: string
  practitionerProfileId: string
  userId: string
  scopes: Array<
    | "active_conditions"
    | "condition_annotations"
    | "recipe_guidance"
    | "meal_plan_guidance"
    | "scan_flag_context"
  >
  status: "pending" | "active" | "revoked" | "expired"
  grantedAt: number | null
  revokedAt: number | null
}
```

Wearable/CGM data requires separate future scope and should not be included by default.

---

## Condition Annotation

Practitioners can annotate active condition profiles only if the user grants scope.

Example:

```text
Practitioner note: keep vitamin K intake consistent rather than avoiding greens entirely.
```

Annotations can appear in:

- condition detail
- scan expanded details
- recipe/meal-plan context

They should not appear as hard system rules unless the user explicitly accepts them into their profile.

---

## Practitioner Cannot

- silently set a user's condition
- delete a user's condition
- view data outside granted scope
- change medication guidance
- access Mesa member data without future explicit Mesa permission design
- publish client data
- send promotional guidance disguised as medical advice

---

## Revocation

On revoke:

- stop practitioner access immediately
- hide future annotations from active context unless user saved them as personal notes
- keep audit trail privately
- notify practitioner access ended without exposing why unless needed

---

## Medical Boundary

Verified practitioner profile does not turn Brioela into telehealth.

Out of scope:

- appointments
- payments
- diagnosis
- prescriptions
- treatment plans
- emergency alerts

In scope:

- food guidance notes
- condition-aware recipe/scan context
- client relationship and consent boundary
