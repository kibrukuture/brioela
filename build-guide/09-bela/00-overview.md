# Bela — Overview

## What This Folder Covers
Brioela's personal grocery delivery service. The user's constraint profile travels with the order and enforces on the shopper's scanner in real time — this is the differentiator no competitor has. Covers: order creation, shopper onboarding (KYC + dedicated Bela card), Stripe Connect Express payouts, PaymentIntent manual capture escrow, constraint travel (constraint profile enforces on shopper's scanner), live scan-together session, shopper AI assistant (Gemini Live, same stack as cooking session), receipt scan at store and door, delivery confirmation, auto-capture alarm, dispute resolution, Ground contribution by shoppers, smart routing, and standing orders.

## Status
[ ] not started

## Specs This Folder Draws From
- `implementable-specs/bela/` — all 16 files (00-overview through 15-checkout-payment)
- `brioela-specs/24-technical-architecture-backbone.md` — OrderAgent DO pattern

## Key Decisions From Specs
- Payment: PaymentIntent `capture_method: 'manual'` — authorization on user's card at order acceptance; no wallet, no Stripe Issuing
- Shopper payment: shopper pays at store till with their own dedicated Bela card (separate debit card registered during onboarding)
- Stripe Connect Express for shopper payouts — Express (not Custom), no Issuing required
- Two-scan proof: shopper scans receipt at store (confirms total, verifies card last-4) AND at door (proves physical presence at delivery)
- User confirmation: full-screen prompt at door, 10-minute window, auto-capture if no response (DO alarm)
- OrderAgent DO: one per order — controls state machine, live scan WebSocket relay, constraint enforcement, shopper AI session
- Shopper AI: same Gemini Live pipeline as cooking session — voice + camera, runs during shopping, reads from order constraint snapshot
- Standing orders: weekly pantry replenishment with zero management
- Bela first launch: one city only — build shopper supply, fix quality issues, expand later

## Tools Built In This Feature
Under `tools/bela/`:
- `check-constraint-for-order.ts` — constraint check at scan time during shopper session
- `release-escrow.ts` — trigger PaymentIntent capture
- `connect-transfer.ts` — payout to shopper

## What This Folder Depends On
- `05-orchestrator` — user constraint profile (copied to OrderAgent at order acceptance)
- `06-scanner` — constraint enforcement pipeline reused for shopper scanner
- `07-cooking-session` — shopper AI uses same Gemini Live connection pattern
- `08-ground` — smart routing uses Ground product_sighting data
- `03-foundation` — Stripe, Supabase orders tables

## What Depends On This Folder
Nothing — Bela is a terminal feature.
