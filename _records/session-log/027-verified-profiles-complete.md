# Session 027 — Verified Profiles Build Guide Complete

## Date

2026-06-06

## Completed This Session

Deep read pass before writing:
- `build-guide/00-rules.md`
- `_records/session-log/026-medical-conditions-complete.md`
- `build-guide/23-verified-profiles/00-overview.md`
- `brioela-specs/18-verified-business-and-practitioner-profiles.md`
- `brioela-specs/19-pricing-and-tiers.md`
- dependency docs: Medical Conditions practitioner boundary, Map data/UI, Auth overview, Ground authenticity gate

Written — `build-guide/23-verified-profiles/`:
- `00-overview.md` — updated to complete, two-lane taxonomy added, dependencies updated
- `01-profile-types.md`
- `02-verification-flow.md`
- `03-verified-business.md`
- `04-verified-profile.md`
- `05-client-and-practitioner-boundary.md`
- `06-analytics-and-revenue.md`

Written — records:
- `_records/connections/20-verified-profiles-connections.md`
- `_records/build-order/22-layer-verified-profiles.md`
- `_records/session-log/027-verified-profiles-complete.md`
- `_records/inventory/inventory.md` status update
- `_records/connections/00-how-to-use.md` index update

## Inventory Status Changes

- `brioela-specs/18-verified-business-and-practitioner-profiles.md` → `[x]`
- `brioela-specs/19-pricing-and-tiers.md` remains `[~]`; only B2B/practitioner tier details were used here

## Product Direction Captured

- Verified Profiles has exactly two top-level lanes: `verified_profile` for people and `verified_business` for businesses.
- Creator/chef is a subtype of `verified_profile`, not a third top-level type.
- Verified business covers restaurants, cafes, grocery/health stores, brands, markets, meal-prep businesses, and similar food businesses.
- Verified Profiles is not a social network and does not have follower counts, likes, comments, or leaderboards.

## In Progress

Nothing half-done.

## What Is Next

Next not-started feature by build order: `24-viral-sharing`.

Before writing:
- `build-guide/00-rules.md`
- latest session log
- `build-guide/24-viral-sharing/00-overview.md`
- `brioela-specs/25-viral-growth-and-sharing.md`
- dependencies: Scanner, Ground, Recipe Ingestion, Kids Mode, Verified Profiles, Pricing if needed

## Blockers / Decisions

- Practitioner access to user condition data requires explicit scoped consent.
- Businesses can improve transparency and source data but cannot pay to suppress safety warnings.
- Creator/chef recipe attribution is handled under verified_profile.
- B2B pricing enforcement belongs to future Pricing Tiers implementation.
