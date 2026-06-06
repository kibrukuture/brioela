# Illness Detective — Overview

## What This Folder Covers
When the user says they feel sick, Brioela looks at the last 24-72 hours of their food history and surfaces the most probable culprit — cross-referencing against active recalls, community illness reports, and known high-risk product patterns. One question asked ("when did symptoms start?"), then a ranked list of suspects with confidence levels and actionable advice. Also has a public health upside: anonymized illness reports cluster into community alerts.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/30-food-illness-detective.md` — full illness detective spec: symptom onset window logic, suspect ranking, community signal, actionable output, privacy model

## Key Decisions From Specs
- Symptom onset determines lookback window: 1-6h = last meal; 6-24h = last 2-3 meals; 24-72h = full window
- Ranking: active recall match (highest) → community illness reports → known high-risk category → new product first time → outside food
- Top 3 suspects shown with plain-language reason each
- Community signal: if user confirms others got sick too → anonymized illness report logged → 3+ reports in 72h at same product/location → community alert in Ground notes
- User opt-in before any data shared with food safety authorities
- Ranking model: single structured LLM call, not streaming — <2s latency
- Illness window queries Orchestrator DO SQLite (scan history + receipt + recipe sessions)
- Community signal aggregation in Supabase (shared, fully anonymized — no user_id, no sub-24h timestamp precision)
- The app never diagnoses — it narrows and advises; diagnosis is medical

## What This Folder Depends On
- `05-orchestrator` — food history window (scan events, receipts, recipe sessions) from DO SQLite
- `15-recall-alerts` — active recall_entry table checked for cross-reference
- `09-ground` — community illness signals appear as Ground notes
- `12-notifications` — follow-up alarm 24h after illness report

## What Depends On This Folder
Nothing — terminal feature.
