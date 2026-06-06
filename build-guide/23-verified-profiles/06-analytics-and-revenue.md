# Verified Profiles — Analytics And Revenue

## What This File Covers

B2B/Practitioner tier behavior, privacy-safe analytics, add-ons, and what profile owners can and cannot see.

---

## Revenue Model

Verified Profiles are a B2B revenue stream.

Pricing spec says B2B/Practitioner tier is roughly `$79-99/month`, with:

- verified business or practitioner profile
- practitioner multi-client management
- client food recommendation push
- verified map listing
- ingredient transparency badge
- analytics for listed products or place
- public recipe profile for creator/chef subtype

Exact enforcement and billing live in `25-pricing-tiers`.

---

## Analytics Principles

Analytics must be aggregate and privacy-safe.

Profile owners can learn whether their listing/content is useful. They cannot identify individual users or private health traits.

---

## Verified Business Analytics

Allowed:

- profile views
- map listing taps
- route/open-map actions
- aggregate scan count for listed products
- aggregate menu views
- aggregate uncertainty trends, such as "shared fryer question often surfaced"
- Ground sentiment categories after Ground privacy gates

Blocked:

- user identities
- allergy/condition breakdowns
- individual scan history
- exact location traces
- private notes
- Mesa membership data

---

## Verified Profile Analytics

Allowed:

- public recipe views
- recipe saves/imports
- cook-start count
- profile views
- client count for practitioner owner
- aggregate client guidance engagement where consent allows

Blocked:

- client identity outside practitioner dashboard
- client medical details without scope
- public follower metrics as social status
- engagement leaderboards

---

## Featured Listing Boundary

`featured_listing` can rank or boost visibility only within trust constraints.

Rules:

- paid placement must be labeled if user-facing
- paid placement cannot override health/safety ranking
- allergen/recall/condition conflicts still win
- user-specific filters still apply first

No pay-to-safety. No pay-to-hide-negative-signal.

---

## Metrics

Product metrics:

- verified profile applications
- approval/rejection rate
- verified business listing interactions
- practitioner-client relationship activation
- public recipe profile imports/saves
- B2B conversion
- churn by profile subtype

Safety metrics:

- profile suspension rate
- false claim reports
- unsafe guidance reports
- transparency claim correction rate
