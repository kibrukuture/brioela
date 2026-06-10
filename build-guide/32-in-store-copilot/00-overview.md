# In-Store Co-Pilot — Overview

## What This Folder Covers
Mira in one earbud during the user's own grocery run. Audio-only session scoped to a store visit: list awareness (plan + predictive pantry + dictation), running spend estimate against the user's own baseline, personal swap suggestions (glucose, price, condition), Mesa-audience checks on scans, store-scoped Ground intelligence, and receipt-scan close-out. The Bela shopper assistant pointed at the user instead of the gig shopper.

## Status
[x] guide complete — five files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-session-lifecycle.md` | shop session DO naming, start/end triggers, geofence end, post-visit workflow |
| `02-context-payload.md` | the session-start payload: list, constraints, Mesa audience, price history, glucose triggers, Ground finds, pantry nudges |
| `03-speech-rules-and-swaps.md` | the silence rules, the 3-intervention cap, swap evidence bar, Ground relay limit |
| `04-spend-estimate.md` | running total: price history → community price → unpriced; receipt as ground truth |
| `05-offline-degradation.md` | dead-zone behavior: scan queue, honest degraded mode, receipt-based completion |

## Specs This Folder Draws From
- `brioela-specs/45-in-store-copilot.md` — the full feature spec
- `implementable-specs/bela/03-constraint-travel.md` — the shared constraint-check implementation (one enforcement path, two callers)
- `implementable-specs/bela/14-shopper-ai-assistant.md` — the sibling capability for gig shoppers
- `brioela-specs/10-mira-cooking-voice.md` — Mira session lifecycle rules reused
- `brioela-specs/29-food-cost-inflation-tracker.md` — purchase_price_event baselines
- `brioela-specs/36-predictive-pantry-intelligence.md` — predicted-need list input

## Key Decisions From Specs
- Audio-only economics (~$0.0045/min): a 30-min weekly shop ≈ $0.14/week. Chef tier, drawing from the standard voice-session allowance; Power unlimited.
- Session DO named `shop-{userId}-{visitId}`, standard Mira lifecycle (thinkingLevel minimal, context at connect, send_realtime_input pushes, inactivity timeout, post-session workflow).
- Silence law hardened: max 3 unprompted interventions per visit excluding safety; safety unlimited and immediate.
- Swap suggestions require personal evidence (own glucose data, own price history, confirmed condition rule). Population-level health commentary is never volunteered.
- Constraint warnings warn — the user decides. (Bela's scanner blocks; the co-pilot's does not. Same check, different consequence.)
- One Ground find relayed per visit, at session start, unless asked.
- No continuous camera, no indoor positioning, no payment. Store presence detection reuses Ground's geo signals — no new tracking.
- Visit records are private; place-level location only; no path-through-store data exists.

## What This Folder Depends On
- `08-cooking-session` — Mira session runtime (shared)
- `11-bela` — constraint-check tools (shared implementation, Rule: do not fork)
- `07-scanner` — scan pipeline and verdicts
- `05-brain` / `06-brain-memory` — context payload assembly
- `09-ground` — store-scoped finds
- `13-receipt-intelligence` — close-out and price retraining
- `26-mesa` — active audience checks
- `20-wearables` — glucose spike triggers in payload

## What Depends On This Folder
- `13-receipt-intelligence` — visits link receipts to listed/scanned items (richer match rates)
- `14-pantry-meal-plan` — bought/skipped outcomes feed pantry state and dislike signals
