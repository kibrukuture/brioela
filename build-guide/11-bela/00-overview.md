# Bela — Overview

## What This Folder Covers
Brioela's personal grocery delivery service. The user's constraint profile travels with the order and enforces on the shopper's scanner in real time — this is the differentiator no competitor has. Covers: order creation, shopper onboarding (KYC + dedicated Bela card), Stripe Connect Express payouts, PaymentIntent manual capture escrow, constraint travel (constraint profile enforces on shopper's scanner), live scan-together session, Mira shopper role (Gemini Live, same live presence runtime as cooking), receipt scan at store and door, delivery confirmation, auto-capture alarm, dispute resolution, Ground contribution by shoppers, smart routing, and standing orders.

## Status
[x] complete — fifteen files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-order-creation.md` | order sources, item approval, estimate, pending state |
| `02-shopper-platform.md` | shopper onboarding, KYC, Connect, dedicated Bela card |
| `03-constraint-travel.md` | frozen constraint snapshot, shopper scanner enforcement |
| `04-live-scan-session.md` | OrderAgent live scan relay between shopper and user |
| `05-payment-and-escrow.md` | PaymentIntent manual capture, no wallet, payout model |
| `06-shopper-quality.md` | quality score, trust relationships, suspension rules |
| `07-ground-contribution.md` | opt-in shopper Ground drafts and privacy boundaries |
| `08-smart-routing.md` | store scoring from map/Ground/product sightings |
| `09-standing-orders.md` | recurring pantry replenishment flow |
| `10-cooking-intent-trigger.md` | cooking session / recipe gap to Bela order |
| `11-for-others.md` | ordering for family/non-users and recipient profiles |
| `12-dispute-resolution.md` | evidence, windows, refunds, constraint violation incidents |
| `13-data-model.md` | Supabase, Brain, OrderAgent, R2 tables/state |
| `14-shopper-ai-assistant.md` | Gemini Live shopper assistant using cooking-session stack |
| `15-checkout-payment.md` | store receipt scan, door scan, auto-capture timer |

## Specs This Folder Draws From
- `implementable-specs/bela/` — all 16 files (00-overview through 15-checkout-payment)
- `brioela-specs/24-technical-architecture-backbone.md` — OrderAgent DO pattern

## Key Decisions From Specs
- Payment: PaymentIntent `capture_method: 'manual'` — authorization on user's card at order acceptance; no wallet, no Stripe Issuing
- Shopper payment: shopper pays at store till with their own dedicated Bela card (separate debit card registered during onboarding)
- Stripe Connect Express for shopper payouts — Express (not Custom), no Issuing required
- Two-scan proof: shopper scans receipt at store (confirms total, verifies card last-4) AND at door (proves physical presence at delivery)
- User confirmation: full-screen prompt at door, 10-minute window, auto-capture if no response (DO alarm)
- OrderAgent DO: one per order — controls state machine, live scan WebSocket relay, constraint enforcement, Mira shopper session
- Mira shopper role: same live presence runtime as cooking — voice + camera, runs during shopping, reads from order constraint snapshot
- Standing orders: weekly pantry replenishment with zero management
- Bela first launch: one city only — build shopper supply, fix quality issues, expand later

## Tools Built In This Feature
Under `tools/bela/`:
- `check-constraint-for-order.ts` — constraint check at scan time during shopper session
- `release-escrow.ts` — trigger PaymentIntent capture
- `connect-transfer.ts` — payout to shopper

## What This Folder Depends On
- `05-brain` — user constraint profile (copied to OrderAgent at order acceptance)
- `07-scanner` — constraint enforcement pipeline reused for shopper scanner
- `30-mira` — shared live presence runtime for voice, vision, stimuli, and role context
- `08-cooking-session` — cooking role implementation pattern
- `09-ground` — Ground finds and location_signal_summary inform routing
- `10-map` — product_sighting, price_sighting, map_place_signal, store data
- `03-foundation` — Stripe, Supabase orders tables

## What Depends On This Folder
Nothing — Bela is a terminal feature.
