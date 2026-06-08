# Recall Alerts — Overview

## What This Folder Covers
Personalized food recall detection. FDA / EFSA / CFIA / RASFF recall feeds polled every 15 minutes via Upstash QStash cron. Each new recall is matched against the scan history of every user in Supabase. Confirmed matches trigger an immediate critical-priority push notification — no quiet hours, no suppression. The notification is specific: "the exact batch of [product] you scanned on [date] has been recalled for [reason]."

## Status
[x] complete — five files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-recall-feed-polling.md` | FDA/EFSA/RASFF/CFIA polling, diffing, queueing |
| `02-recall-matching.md` | UPC/lot/date matching against scan history |
| `03-critical-notification.md` | Orchestrator delivery, critical priority, content rules |
| `04-recall-detail-and-resolution.md` | detail screen, official notice, discard/resolve flow |
| `05-data-model.md` | recall_entry, recall_scan_match, processing state |

## Specs This Folder Draws From
- `brioela-specs/26-personalized-recall-alerts.md` — full recall spec: data sources, matching logic, notification content, recall detail screen, edge cases, technical constraints

## Key Decisions From Specs
- Recall polling: global Upstash QStash cron — NOT inside any user's DO (user DOs cannot run global polling)
- Match query: one query per recall entry against ALL scan_events in Supabase — batch-efficient, not per-user
- Confirmed match (lot number matches scan): "you have this" — not "you might have"
- Broad match (all lots recalled, within 90 days of scan): "you may have this"
- Push delivery: routed through each matching user's Orchestrator DO (respects device token and notification state)
- Critical priority: no suppression, no quiet hours — Listeria recall does not care it is 2am
- Recall detail screen: product photo from scan history, verbatim recall reason, lot numbers, what to do, link to official notice, "I discarded it" confirmation
- Retracted recall: send follow-up "recall has been cleared — no action needed"
- Geo-scoped: FDA alerts for US products; EFSA/RASFF for EU; CFIA for Canada

## Product Exposure Ledger

Recall matching must target a unified private product exposure ledger from the first shipped product,
not barcode scans alone. A user can be exposed to a product through several paths:

- barcode scan
- receipt line-item match
- Bela checkout receipt proof
- pantry confirmation
- manual product log

`scan_event` is one exposure source, not the exposure model. Receipt matches, Bela checkout proof,
pantry confirmations, and manual logs must also create product exposure records. This fixes the
failure mode where a recalled product appears on a receipt or Bela order but was never individually
scanned by the user.

Example:

```text
Receipt: "Danone yogurt 4pk" matched to product_123 with 0.88 confidence.
Recall: product_123 recalled for lot range A12-A19.
User never scanned barcode.
Recall still creates a candidate exposure match, with confidence tied to receipt match quality.
```

## What This Folder Depends On
- `07-scanner` — `scan_event` rows in Supabase are the match target
- `12-notifications` — push delivery through notification system
- `03-foundation` — Upstash QStash for polling cron, Supabase for scan_event and recall tables

## What Depends On This Folder
- `16-illness-detective` — active recall matches are highest-weight suspect in illness ranking

## Boundary

This feature owns recall ingestion and match creation. Notification delivery rules come from `12-notifications`. Scanner owns scan history capture.
