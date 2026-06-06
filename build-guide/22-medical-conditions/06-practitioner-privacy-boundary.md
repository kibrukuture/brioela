# Medical Conditions — Practitioner And Privacy Boundary

## What This File Covers

Verified practitioner access, consent, annotations, privacy rules, deletion/export, and the non-medical product boundary.

---

## Practitioner Boundary

Practitioner integration depends on `23-verified-profiles` and is not required for Medical Conditions v1.

The user sets and owns their condition profile. A practitioner may annotate or suggest guidance later, but the practitioner does not silently set the user's condition.

---

## Consent Model

Before a practitioner can view or annotate condition data:

1. Practitioner relationship is verified.
2. User grants explicit access.
3. User chooses scope.
4. User can revoke access any time.

Scope examples:

- active condition names only
- condition names + scan flags
- condition names + recipe/meal plan guidance
- no wearable/CGM data unless separately granted

---

## Practitioner Annotation

```typescript
type PractitionerConditionAnnotation = {
  annotationId: string
  userId: string
  practitionerId: string
  conditionProfileId: string
  note: string
  status: "active" | "revoked" | "archived"
  createdAt: number
  revokedAt: number | null
}
```

Annotations can appear in scan details or condition detail surfaces if user allowed it.

Example:

```text
Practitioner note: keep vitamin K intake consistent rather than avoiding greens entirely.
```

---

## Privacy Non-Negotiables

- Conditions live in Orchestrator DO private storage.
- Conditions never go to Ground/community notes.
- Conditions never go to shared menu/map/product tables.
- Conditions are never used for ads.
- Conditions are never exposed to Mesa members without explicit future permission design.
- Practitioner access requires explicit user grant.
- User can delete condition data.

---

## Export And Deletion

Export:

- condition profiles are excluded by default from generic exports
- user must explicitly include medical data
- export labels practitioner annotations separately from user-confirmed condition state

Deletion:

- deactivate active condition immediately
- remove private profile and flag events when full deletion requested
- revoke practitioner access to deleted condition
- remove condition context from future scans/recipes/meal plans

---

## Non-Medical Product Boundary

Brioela is food guidance software, not a medical device.

Allowed language:

- "This conflicts with your active celiac food profile."
- "This is high sodium for your hypertension food settings."
- "Ask your clinician if you are unsure."

Blocked language:

- "This diagnoses your condition."
- "This treats your condition."
- "This replaces clinician advice."
- "Change medication or dosage."
- "This proves a medical outcome."

---

## Safety Escalation

If a user asks medical questions beyond food filtering, the assistant should decline and redirect:

```text
I can help you understand food ingredients and your saved food rules, but I can't give medical advice. For medication or treatment questions, ask your clinician.
```

The assistant can still help formulate ingredient questions or show food facts.
