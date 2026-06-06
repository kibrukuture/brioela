# Session 018 — Menu Scanning Community Intelligence Addendum

## Date

2026-06-06

## Completed This Session

Deep read pass before writing:
- `build-guide/00-rules.md`
- `_records/session-log/017-menu-scanning-complete.md`
- `build-guide/17-menu-scanning/00-overview.md`
- `build-guide/17-menu-scanning/01-input-capture.md`
- `build-guide/17-menu-scanning/05-storage-offline-map.md`
- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/35-ground-community-intelligence.md`
- `build-guide/10-map/03-nearby-ranking-api.md`
- `build-guide/09-ground/00-overview.md`

Written/updated — `build-guide/17-menu-scanning/`:
- `00-overview.md` — expanded to include QR auto-loading, shared menu intelligence, and personalized discovery
- `01-input-capture.md` — added QR code capture as first-class menu URL resolution path
- `02-menu-ocr-and-parsing.md` — added QR URL source and resolved URL output
- `05-storage-offline-map.md` — clarified raw OCR transient boundary versus normalized shared menu facts
- `06-shared-menu-intelligence.md` — new shared restaurant/menu data model and privacy boundary
- `07-personalized-restaurant-discovery.md` — new user-specific restaurant ranking and map-discovery design

Updated records:
- `_records/connections/13-menu-scanning-connections.md`
- `_records/build-order/15-layer-menu-scanning.md`
- `_records/session-log/018-menu-scanning-community-intelligence-addendum.md`

## Product Direction Captured

- Paper menus, QR menus, and website menus are all first-class inputs.
- QR codes resolve to the restaurant menu website and Brioela transforms that page into its own green/yellow/red dish view.
- User health constraints stay private in Orchestrator SQLite.
- Normalized public menu facts and aggregate safety signals can go to shared Postgres/Supabase tables.
- Repeated menu scans create community restaurant intelligence without exposing user health profiles.
- At very large scale, Brioela can rank restaurants by personal health fit, menu clarity, affordability, freshness, and community confidence rather than generic popularity.

## In Progress

Nothing half-done.

## What Is Next

Next not-started feature by build order: `18-ambient-intelligence`.

Before writing, read:
- `build-guide/00-rules.md`
- latest session log
- `build-guide/18-ambient-intelligence/00-overview.md`
- `brioela-specs/22-pre-trip-food-intelligence.md`
- dependencies: Map, Notifications, Orchestrator, Memory Engine

## Blockers / Decisions

- Shared menu intelligence must not store private health constraints.
- Public restaurant/menu facts can be shared; personalized verdicts are recomputed per user.
- Brioela should guide to the best restaurants for the user, not dump generic restaurant lists.
