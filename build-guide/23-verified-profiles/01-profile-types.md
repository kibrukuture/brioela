# Verified Profiles — Profile Types

## What This File Covers

The top-level taxonomy for Verified Profiles. Brioela has two verified lanes only: people and businesses.

---

## Core Rule

There are exactly two top-level profile kinds:

```typescript
type VerifiedProfileKind = "verified_profile" | "verified_business"
```

Do not create a third top-level `creator` kind. Creators, chefs, dietitians, and practitioners are people, so they are `verified_profile` subtypes.

---

## Verified Profile

`verified_profile` means a verified person.

Subtypes:

- dietitian
- nutritionist
- clinician
- health practitioner
- coach if approved
- chef
- food educator
- recipe creator

Capabilities depend on subtype and verification evidence.

Examples:

- A dietitian can request client relationships and annotate condition guidance after consent.
- A chef can publish a structured public recipe profile.
- A food educator can have verified attribution on recipes or food literacy content.

---

## Verified Business

`verified_business` means a verified organization or place.

Subtypes:

- restaurant
- cafe
- cloud kitchen
- meal-prep business
- health food store
- grocery store
- food brand
- local market
- farm/vendor if listed as a place or seller

Capabilities depend on subtype.

Examples:

- A restaurant can verify menu/allergen transparency.
- A grocery store can verify product availability or store details.
- A brand can verify ingredients, sourcing, certifications, or product metadata.

---

## Shared Base Shape

```typescript
type VerifiedEntity = {
  profileId: string
  kind: "verified_profile" | "verified_business"
  subtype: string
  ownerUserId: string
  displayName: string
  verificationStatus: "draft" | "pending_review" | "verified" | "rejected" | "suspended" | "expired"
  publicSlug: string
  createdAt: number
  updatedAt: number
}
```

Top-level features should switch on `kind`, then subtype.

---

## Not A Social Network

Verified Profiles are not follower accounts.

Blocked:

- public follower counts
- likes
- comment threads
- influencer leaderboards
- engagement bait
- public reputation scores

Allowed:

- verification badge
- public recipe/source attribution
- verified map listing
- ingredient/menu transparency
- consent-based practitioner/client relationship
- privacy-safe analytics to the profile owner

The product value is trust and structured food intelligence, not social performance.
