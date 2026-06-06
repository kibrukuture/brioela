# Session 032 — Markdown Audit Complete

## Date

2026-06-06

## Completed This Session

Audited Markdown across:
- `build-guide/**/*.md`
- `_records/**/*.md`
- `_records/inventory/inventory.md`
- `_records/connections/00-how-to-use.md`
- `_records/build-order/*.md`
- recent session logs

Focused checks:
- stale Mesa overview-only references
- old customer-facing tier names after Sapor/Luma/Culina/Viva/Mesa/Signet naming
- `v1` language where it was product-version wording rather than API/schema version
- build-order dependency mistakes
- connection-map index drift
- inventory status drift
- Viral Sharing/Mesa compatibility status

Patched:
- `build-guide/25-pricing-tiers/00-overview.md` — Mesa dependency wording now reflects final policy/member limits
- `build-guide/24-viral-sharing/00-overview.md` — Mesa compatibility wording no longer says overview-only/future
- `build-guide/24-viral-sharing/04-feature-specific-card-types.md` — Mesa card wording now references Mesa compatibility data
- `_records/connections/21-viral-sharing-connections.md` — Mesa card connection marked done
- `build-guide/22-medical-conditions/00-overview.md` — removed product-version wording from supported conditions
- `build-guide/22-medical-conditions/01-condition-detection-confirmation.md` — changed `Supported V1 Conditions` to `Supported Conditions`
- `build-guide/22-medical-conditions/06-practitioner-privacy-boundary.md` — removed Medical Conditions version wording
- `build-guide/21-kids-mode/00-overview.md` — Core tier wording changed to Luma
- `build-guide/21-kids-mode/05-safety-and-tier-boundary.md` — Core/free wording changed to Luma/Sapor
- `build-guide/17-menu-scanning/00-overview.md` — Core upgrade wording changed to Luma
- `build-guide/17-menu-scanning/05-storage-offline-map.md` — Core upgrade wording changed to Luma
- `build-guide/14-pantry-meal-plan/03-meal-plan-generation.md` — Core/free wording changed to Luma/Sapor
- `build-guide/07-scanner/04-scan-result-ui.md` — Core tier wording changed to Luma
- `_records/build-order/19-layer-kids-mode.md` — Core wording changed to Luma
- `build-guide/23-verified-profiles/00-overview.md` — B2B wording changed to Signet where customer-facing
- `build-guide/23-verified-profiles/06-analytics-and-revenue.md` — B2B wording changed to Signet where customer-facing
- `_records/build-order/22-layer-verified-profiles.md` — B2B wording changed to Signet
- `_records/session-log/027-verified-profiles-complete.md` — B2B wording clarified as Signet/source-tier mapping
- `_records/build-order/23-layer-viral-sharing.md` — Mesa card wording no longer future-only
- `_records/session-log/028-viral-sharing-complete.md` — Mesa cards no longer say Mesa overview-only
- `_records/session-log/029-pricing-tiers-complete.md` — updated to note Mesa was later expanded in Session 030
- `_records/session-log/023-kids-mode-complete.md` — Core tier wording changed to Luma
- `build-guide/26-mesa/00-overview.md` — removed remaining `v1` wording and resolved pricing/member open decisions
- `build-guide/26-mesa/09-privacy-permissions.md` — clarified wearable sharing wording

## Legitimate Matches Left Unchanged

- API paths containing `/v1` or model names like `bge-base-en-v1.5` are technical identifiers, not product-version language.
- Oura `V1 removal` wording is historical API documentation context.
- Pricing docs intentionally keep old spec names as internal/source aliases in mapping tables only.
- Older session logs may mention what was true at that time; latest logs supersede them.

## Current State

- All current numbered build-guide feature folders have a build-guide pass.
- Mesa is complete, no longer overview-only.
- Pricing names are Sapor, Luma, Culina, Viva, Mesa, Signet.
- `brioela-specs/41-mesa.md` is `[x]`.
- `brioela-specs/19-pricing-and-tiers.md` is `[x]`.

## Remaining Partials In Inventory

Still `[~]` by design or because only partial source material is processed:
- `brioela-specs/00-product-philosophy-and-ux.md`
- `brioela-specs/12-multi-person-cooking-rooms.md`
- `brioela-specs/20-platform-and-app-distribution.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `brioela-specs/39-generative-ui.md`
- `implementable-specs/13-gaps-and-missing-specs.md`

## What Is Next

Recommended next step: decide whether to reconcile remaining partial specs or begin implementation in build order.
