# In-Store Co-Pilot — Session Context Payload

## What This File Covers

What the Brain DO assembles at session start.

## Source Specs

- `brioela-specs/45-in-store-copilot.md`

## Payload Contents

| Block | Source |
|---|---|
| shopping list with per-item status (plan / prediction / dictated) | meal plan slots, predictive pantry list, voice |
| hard constraints, dietary identity, conditions, medications | constraint + memory tables |
| active Mesa audience, if selected | Mesa member constraint snapshots |
| price history for this store: top recurring items + weekly baseline | purchase_price_event |
| glucose spike triggers | user_memory health.glucose |
| Ground finds for this store, last 7 days, fresh first | location_signal_summary + find |
| open predictive pantry nudges | predictive_nudge |

## Assembly Rules

- One payload, assembled by the Brain DO at session start — the standard `get_session_context` path with a shop-scoped variant.
- Mesa audience is conservative: explicitly active audience or recurring-pattern memory only. Never guessed.
- Ground finds are read through the cached map paths, never raw `find` queries.

## Rule

Everything Mira knows in the store comes from this payload plus live scans. No mid-session fetches against Supabase from the session DO.
