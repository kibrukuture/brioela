# Session 017 — Menu Scanning Build Guide Complete

## Date

2026-06-06

## Completed This Session

Deep read pass before writing:
- `build-guide/00-rules.md`
- `_records/session-log/016-illness-detective-complete.md`
- `build-guide/17-menu-scanning/00-overview.md`
- `brioela-specs/27-restaurant-menu-scanning.md`
- dependency docs: Scanner GPT-4o mini vision fallback, Map overview, Brain tool protocol, Memory Engine SQLite schema

Written — `build-guide/17-menu-scanning/`:
- `00-overview.md` — updated to complete, file list added, pricing trigger boundary noted
- `01-input-capture.md`
- `02-menu-gpt4o-mini-vision-and-parsing.md`
- `03-dish-verdicts.md`
- `04-waiter-questions.md`
- `05-storage-offline-map.md`

Written — records:
- `_records/connections/13-menu-scanning-connections.md`
- `_records/build-order/15-layer-menu-scanning.md`
- `_records/session-log/017-menu-scanning-complete.md`
- `_records/inventory/inventory.md` status update

## Inventory Status Changes

- `brioela-specs/27-restaurant-menu-scanning.md` → `[x]`

## In Progress

Nothing half-done.

## What Is Next

Next not-started feature by build order: `18-ambient-intelligence`.

Before writing, read:
- `build-guide/00-rules.md`
- latest session log
- `build-guide/18-ambient-intelligence/00-overview.md`
- `brioela-specs/22-pre-trip-food-intelligence.md`
- likely dependencies: Map, Notifications, Brain, Memory Engine

## Blockers / Decisions

- Menu scanning uses one-shot GPT-4o mini vision extraction plus structured text parsing, not Gemini Live.
- Unknown ingredients default yellow, never green.
- Yellow dishes always include a specific waiter question.
- Raw extracted menu content is transient unless the user explicitly saves.
- Offline mode is partial and must clearly say community notes/current profile may be unavailable.
