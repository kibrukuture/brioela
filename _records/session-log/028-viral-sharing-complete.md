# Session 028 — Viral Sharing Build Guide Complete

## Date

2026-06-06

## Completed This Session

Deep read pass before writing:
- `build-guide/00-rules.md`
- `_records/session-log/027-verified-profiles-complete.md`
- `build-guide/24-viral-sharing/00-overview.md`
- `brioela-specs/25-viral-growth-and-sharing.md`
- `build-guide/23-verified-profiles/04-verified-profile.md`
- `build-guide/19-recipe-ingestion/08-shared-content-router.md`
- dependency docs: Scanner share action, Kids Mode share card, Menu Scanning personalized discovery, Mesa overview, Wearables CGM sharing boundary

Written/updated — `build-guide/23-verified-profiles/`:
- `00-overview.md` — added creator video firewall file to list and key decisions
- `04-verified-profile.md` — added Brioela-ready step videos and no infinite feed boundary
- `07-creator-video-firewall.md` — new file: verified_profile creator videos can surface only through relevance firewall, not an infinite TikTok-like feed

Written — `build-guide/24-viral-sharing/`:
- `00-overview.md` — rewritten around Discovery Cards: share the discovery, not the app
- `01-shareable-moment-taxonomy.md`
- `02-discovery-card-system.md`
- `03-privacy-scrub-and-consent.md`
- `04-feature-specific-card-types.md`
- `05-creator-and-attribution-loop.md`
- `06-growth-metrics-and-suppression.md`

Written/updated records:
- `_records/connections/20-verified-profiles-connections.md`
- `_records/connections/21-viral-sharing-connections.md`
- `_records/build-order/23-layer-viral-sharing.md`
- `_records/session-log/028-viral-sharing-complete.md`
- `_records/inventory/inventory.md`
- `_records/connections/00-how-to-use.md`

## Product Direction Captured

- Viral Sharing is Discovery Cards, not generic share buttons.
- Share the discovery, not the app.
- Every card passes privacy scrub before rendering.
- Do not leak allergies, child identity, medical conditions, exact location, private Mesa names, practitioner/client data, or wearable/glucose data by default.
- Creator/chef attribution uses `verified_profile` and no third creator lane.
- Creator videos require a relevance firewall: no infinite feed, no autoplay feed, no follower-ranking discovery.
- Mesa compatibility card type is future-ready but depends on Mesa implementation decisions.

## Inventory Status Changes

- `brioela-specs/25-viral-growth-and-sharing.md` → `[x]`

## In Progress

Nothing half-done.

## What Is Next

Next not-started feature by build order: `25-pricing-tiers`.

Before writing:
- `build-guide/00-rules.md`
- latest session log
- `build-guide/25-pricing-tiers/00-overview.md`
- `brioela-specs/19-pricing-and-tiers.md`
- dependencies: Auth/Onboarding, Orchestrator, features with tier gates, Mesa overview

## Blockers / Decisions

- Personal response/glucose cards are blocked by default and require explicit opt-in.
- Mesa cards are future-ready only while Mesa remains overview-only.
- Discovery Card implementation needs design-system templates before UI build.
