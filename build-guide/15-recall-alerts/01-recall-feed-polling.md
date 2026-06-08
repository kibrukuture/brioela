# Recall Alerts — Feed Polling

## What This File Covers

Global recall feed polling, diffing, and queueing.

## Source Specs

- `brioela-specs/26-personalized-recall-alerts.md`

## Data Sources

- FDA recalls / market withdrawals / safety alerts
- EFSA
- RASFF
- CFIA

## Polling Rule

Recall polling is global.

It does not run inside per-user Brain DOs.

Use Upstash QStash cron or equivalent global scheduled worker.

## Frequency

- FDA: every 15 minutes
- other sources: hourly unless changed later

## Flow

1. Poll source feed.
2. Normalize raw recall entry.
3. Diff against last seen source state.
4. Store new recall entry.
5. Enqueue match processing.

## Geo Scope

Recall source is geo-scoped.

Users only receive recalls relevant to products they scanned or places they traveled/scanned.
