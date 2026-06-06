# Verified Profiles — Verified Business

## What This File Covers

Verified business profiles: restaurants, cafes, grocery stores, brands, markets, cloud kitchens, meal-prep companies, and other food businesses.

---

## Product Role

Verified businesses improve trust in Brioela's real-world food intelligence.

They can supply or confirm:

- place identity
- menu data
- allergen handling statements
- ingredient transparency
- product metadata
- sourcing/certifications
- availability or price feeds later

They do not get to override user safety logic.

---

## Business Shape

```typescript
type VerifiedBusinessProfile = {
  profileId: string
  kind: "verified_business"
  subtype: "restaurant" | "cafe" | "cloud_kitchen" | "meal_prep" | "health_store" | "grocery_store" | "brand" | "market" | "other"
  ownerUserId: string
  displayName: string
  placeId: string | null
  verificationStatus: VerificationStatus
  transparencyFieldsJson: string
  createdAt: number
  updatedAt: number
}
```

---

## Map Listing

Verified businesses can appear on the healthy food map.

Listing surfaces:

- verified badge
- business subtype
- ingredient transparency summary
- community/Ground signals separately
- menu/product links where available
- user-specific fit summary if enough data exists

Map must keep verified business data separate from Ground community observations. A business claim is not a community find.

---

## Menu And Allergen Transparency

Restaurants/cafes can submit structured menu transparency:

- allergen statement
- gluten/celiac handling notes
- vegan/vegetarian markers
- preparation/cross-contact notes
- ingredient/source notes
- updated menu URL

Boundary:

- Brioela can show verified business-provided data as a source.
- Brioela still computes user-specific green/yellow/red verdicts privately.
- A business cannot mark an item universally safe for all users.

---

## Product And Brand Transparency

Brands/stores can submit:

- ingredient metadata
- allergen statements
- origin/sourcing
- certifications
- product images
- UPC/product mapping

These can improve product resolution confidence, but user-specific constraints remain private and computed by Brioela.

---

## Business Analytics

Verified businesses can receive privacy-safe analytics:

- profile views
- map interactions
- scan counts for their listed products/place where privacy-safe
- aggregate community sentiment categories
- menu/item uncertainty trends

Blocked analytics:

- individual user identity
- private health conditions
- allergy profiles
- raw scan histories
- per-user movement/location trails

---

## No Pay-To-Safety

Verified business status cannot buy a better safety verdict.

Businesses can improve data quality and transparency. They cannot pay to suppress warnings, allergy flags, recall matches, or community safety signals.
