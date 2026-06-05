# Recall Alerts — Overview

## What This Folder Covers
Personalized food recall detection. FDA / EFSA / CFIA / RASFF recall feeds polled every 15 minutes via Upstash QStash cron. Each new recall is matched against the scan history of every user in Supabase. Confirmed matches trigger an immediate critical-priority push notification — no quiet hours, no suppression. The notification is specific: "the exact batch of [product] you scanned on [date] has been recalled for [reason]."

## Status
[ ] not started

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

## What This Folder Depends On
- `06-scanner` — `scan_event` rows in Supabase are the match target
- `10-notifications` — push delivery through notification system
- `03-foundation` — Upstash QStash for polling cron, Supabase for scan_event and recall tables

## What Depends On This Folder
- `13-illness-detective` — active recall matches are highest-weight suspect in illness ranking
