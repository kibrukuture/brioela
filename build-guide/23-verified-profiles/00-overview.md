# Verified Profiles — Overview

## What This Folder Covers
Verified profiles on the Brioela platform, split into exactly two top-level lanes: `verified_profile` for people and `verified_business` for businesses. People can be practitioners, nutritionists, dietitians, chefs, or creators. Businesses can be restaurants, cafes, cloud kitchens, meal-prep companies, health food stores, grocery stores, brands, or markets. Verified Profiles plug into the consumer product through map listings, recipe/source attribution, client guidance, ingredient transparency, and analytics. Limited in scope — this is not a social network or marketplace-first product.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-profile-types.md` | two-lane model: verified_profile for people, verified_business for businesses |
| `02-verification-flow.md` | application, evidence, review, status, renewal, rejection |
| `03-verified-business.md` | business listings, transparency fields, map/menu/product trust surfaces |
| `04-verified-profile.md` | person profiles: practitioner/client guidance and creator/chef recipe attribution |
| `05-client-and-practitioner-boundary.md` | user consent, condition annotations, no diagnosis/treatment boundary |
| `06-analytics-and-revenue.md` | B2B tier, profile analytics, privacy-safe metrics, pricing boundary |

## Specs This Folder Draws From
- `brioela-specs/18-verified-business-and-practitioner-profiles.md` — verified profile spec: who qualifies, what they get, practitioner-client relationship
- `brioela-specs/19-pricing-and-tiers.md` — B2B/Practitioner tier pricing and features

## Key Decisions From Specs
- Practitioners can view client active conditions and push food guidance (client must grant access)
- Verified map listing with ingredient transparency badge
- Analytics: scan counts, community note sentiment for their listed products/places
- Creator/chef public recipe profile is a `verified_profile` subtype, not a third top-level type
- Top-level model has only two kinds: `verified_profile` and `verified_business`
- Practitioner does NOT set the user's condition — the user does; practitioner can annotate with notes that appear in scan verdicts
- Up to 10 client accounts per practitioner account
- This is a B2B revenue stream, not a consumer social feature

## What This Folder Depends On
- `05-orchestrator` — practitioner reads client condition data from DO (with client permission)
- `10-map` — verified listing appears on healthy food map
- `04-auth-and-onboarding` — practitioner role gating and verification flow
- `22-medical-conditions` — active conditions and practitioner annotation boundary
- `19-recipe-ingestion` — creator/chef recipe attribution and structured recipe source profile
- `17-menu-scanning` — verified business menu transparency and restaurant trust surfaces

## What Depends On This Folder
- `25-pricing-tiers` — B2B/Practitioner subscription and add-ons
- Future practitioner/client management
- Future verified business analytics and menu/product transparency upgrades
