# Verified Profiles — Verification Flow

## What This File Covers

Application, evidence collection, review, status transitions, renewal, rejection, and suspension for both verified people and verified businesses.

---

## Verification States

```typescript
type VerificationStatus =
  | "draft"
  | "pending_review"
  | "verified"
  | "rejected"
  | "suspended"
  | "expired"
```

Only `verified` profiles get public badges and verified feature access.

---

## Application Flow

1. User chooses `verified_profile` or `verified_business`.
2. User chooses subtype.
3. User submits required evidence.
4. Brioela runs automated completeness checks.
5. Human/admin review approves, rejects, or requests more information.
6. Verified profile becomes visible where relevant.

Verification is not instant self-serve for medical/practitioner claims.

---

## Evidence Examples

Verified profile evidence:

- name or public professional identity
- license or credential when claiming practitioner/dietitian/clinician status
- public website/social proof for chef/creator/educator subtype
- business email/domain where applicable
- jurisdiction for regulated credentials

Verified business evidence:

- business registration or claimed ownership proof
- place ownership or listing proof
- menu/product/ingredient data source
- website/domain/social proof
- address/place ID when location-based

---

## Review Rules

Automated checks can catch missing evidence, obvious mismatch, or duplicate claims.

Human/admin review is required for:

- practitioner credentials
- medical/condition guidance privileges
- business ownership conflicts
- suspension appeals
- high-reach public profile verification

Do not let an LLM approve regulated credentials.

---

## Status Transitions

```text
draft → pending_review → verified
draft → pending_review → rejected
verified → suspended
verified → expired
suspended → verified after appeal/review
expired → pending_review after renewal
```

Rejected applications should receive a clear reason. Suspensions should hide verified badge and privileged features immediately.

---

## Renewal

Practitioner credentials and business ownership can expire.

Renewal rules:

- warn before expiry in owner dashboard
- remove badge on expiry
- keep public profile visible as unverified only if safe
- disable client/condition privileges when practitioner verification expires

---

## Abuse Boundary

Verified status is trust infrastructure.

Suspend for:

- false credential claims
- misleading medical claims
- promotional spam in guidance fields
- business impersonation
- repeated unsafe ingredient/menu claims
- attempting to access client data without consent

Suspension reasons are internal by default. User-facing copy should be factual, not defamatory.
