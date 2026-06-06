# Verified Profiles — Verified Profile

## What This File Covers

Verified people on Brioela: practitioners, dietitians, nutritionists, clinicians, chefs, creators, and food educators. This is one top-level lane: `verified_profile`.

---

## Product Role

Verified people create trust around guidance and attribution.

They can be:

- practitioners who guide clients
- dietitians/nutritionists with verified credentials
- chefs/creators whose recipes should carry verified attribution
- food educators whose content can be trusted as a source

Do not create a separate top-level creator type.

---

## Profile Shape

```typescript
type VerifiedPersonProfile = {
  profileId: string
  kind: "verified_profile"
  subtype: "dietitian" | "nutritionist" | "clinician" | "health_practitioner" | "coach" | "chef" | "creator" | "food_educator"
  ownerUserId: string
  displayName: string
  credentialSummary: string | null
  verificationStatus: VerificationStatus
  publicRecipeProfileEnabled: boolean
  clientFeaturesEnabled: boolean
  createdAt: number
  updatedAt: number
}
```

Capabilities are subtype- and verification-dependent.

---

## Practitioner Capabilities

Practitioner subtypes may get client features after stricter verification.

Capabilities:

- request client connection
- view client condition profile only after consent
- add condition-specific food guidance notes
- recommend recipe/meal-plan constraints within allowed scope
- manage limited client accounts per pricing tier

Practitioner does not set a user's condition. The user owns and confirms conditions.

---

## Creator/Chef Capabilities

Creator/chef subtypes can have a public recipe/source profile.

Capabilities:

- verified attribution on recipes imported from their content
- public recipe profile page
- Brioela-ready step-by-step videos, gated by the creator video firewall
- structured recipe metadata if they publish Brioela-native recipes later
- source credibility for recipe ingestion

This is the marketing loop: creators can tell followers to save/cook their food in Brioela, while Brioela preserves attribution and improves recipe structure.

Boundary:

- creator profile is still a `verified_profile`
- no follower counts or social feed required
- no infinite creator video feed
- no public comments/likes
- no automatic scraping into public recipe databases

---

## Public Profile Surface

Public person profile can show:

- display name
- subtype/credential label
- verification badge
- short bio
- public recipes/content if enabled
- business/practice link if allowed

Do not show:

- private clients
- client health data
- private guidance notes
- unverified credential claims as verified

---

## Trust Boundary

Verified person status means Brioela reviewed identity/claims enough to show a badge. It does not mean Brioela endorses all advice.

Practitioner guidance must still stay within Brioela's medical boundary: food guidance and annotations, not diagnosis/treatment/prescription.
