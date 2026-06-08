# Illness Detective — Lookback Window

## What This File Covers

How symptom onset determines the food history window.

## Source Specs

- `brioela-specs/30-food-illness-detective.md`
- `build-guide/07-scanner/`
- `build-guide/13-receipt-intelligence/`

## Window Rules

| Symptom onset | Query window |
|---|---|
| 1-6 hours | last meal |
| 6-24 hours | last 2-3 meals |
| 24-72 hours | full 72-hour window |

## Data Sources

- scan events
- receipt history
- recipe/cooking sessions
- restaurant/menu events later
- recall matches

## Storage Boundary

Food history query starts in Brain DO SQLite.

Recall/community data can be joined from shared stores after candidate food window is built.

## Rule

Do not query every user. This is per-user investigation after a user report.
