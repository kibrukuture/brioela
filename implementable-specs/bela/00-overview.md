# Bela — Overview

## What Bela Is

**Bela** is Brioela's personal grocery delivery service — a brand name, not a feature label. Users say "I'll Bela it." Media writes "Bela by Brioela." The name is warm, short, and its own thing.

What it does: the user's card is authorized (locked) at order acceptance, the AI builds the grocery list from their cooking history, a KYC-verified gig shopper goes to the store with a voice + camera AI assistant in their ear, buys exactly the right things using the Brioela scanner, pays at checkout with their own dedicated Bela card, scans the receipt, delivers to the door, and the user confirms receipt in the app — releasing payment to the shopper immediately.

Payment is locked on the user's card from the moment the order is accepted. It is captured only when the user confirms delivery (or auto-confirms after 10 minutes). No wallet. No pre-funded balance. Stripe holds the authorization; Brioela triggers the capture.

This is not Instacart. The core differentiator is one sentence: **the user's full AI constraint profile — allergies, dietary restrictions, boycotts, preferences — travels with the order and enforces on the shopper's scanner in real time.** A shopper shopping for a user with a sesame allergy cannot buy a product containing sesame. The scanner blocks it. The allergy cannot follow the user unless Bela is involved.

---

## The One Differentiator That Matters

Every grocery delivery service has shoppers. Every service lets you write a list. None of them carry the user's health and dietary identity into the store with the shopper.

Instacart's shopper does not know your allergies unless you type them in a text note they may or may not read. Brioela's shopper cannot buy something that will hurt you — the scanner enforces this automatically, per product, in real time, with the full constraint database.

This is the safety claim that no competitor can make.

---

## System Components

```
User App                    Shopper App Mode               Backend
────────────────────        ────────────────────           ────────────────────────────
Order creation flow    →    Order queue + map              Orchestrator DO (per user)
AI list generation          Constraint-enforced scanner    CookingAgent DO (session link)
Live scan-together view     Live scan sync                 OrderAgent DO (per order)
Authorization + confirm UI  Delivery confirmation          Stripe Connect (hold + payout)
Standing order setup        Ground auto-draft              Supabase Postgres (shared tables)
Cooking intent trigger      Shopper quality tracker        Cloudflare R2 (delivery photos)
Dispute submission          Routing map
```

### The OrderAgent Durable Object

Each active order gets its own `OrderAgent` DO, keyed by `order_id`. It controls:
- Order state machine (created → accepted → shopping → in-transit → delivered → completed)
- Live scan-together WebSocket relay (shopper scans → user sees result)
- Constraint enforcement lookup (reads from user's Orchestrator DO)
- Delivery confirmation and escrow release trigger
- Dispute state if raised

DO ID: `env.ORDER_AGENT.idFromName(orderId)`

The OrderAgent is created when a shopper accepts an order. It is archived (no longer addressed) after completion or cancellation. All order state is flushed to Supabase Postgres before the DO can be evicted.

---

## Architecture: How an Order Flows

```
1. User's AI generates grocery list from cooking history + pantry memory
2. User approves the list and selects a delivery window
3. Order enters Supabase orders table with status = 'pending'
4. Nearest available KYC-verified shoppers are notified
5. A shopper accepts → OrderAgent DO is created → status = 'accepted'
6. Authorization hold placed on user's card (Stripe PaymentIntent, capture_method: 'manual') — money locked, not yet charged
7. Shopper navigates to the store using the smart route (Ground + product_sighting data)
8. Shopper AI assistant (voice + camera) activates — shopper talks to the AI throughout the shop
9. Shopper scans each product → constraint check → user sees result (live scan-together) → AI confirms aloud
10. Shopper pays at checkout till with their dedicated Bela card (their own debit card, registered during onboarding)
11. Shopper scans receipt in app → actual total confirmed → authorization incremented if needed
12. Shopper travels to delivery address → taps "I've arrived" → scans receipt again at door
13. User receives full-screen confirmation prompt — "Confirm delivery?" with 10-minute timer
14. User confirms → Stripe PaymentIntent captured → Stripe Connect transfer fires immediately to shopper
15. Platform retains service fee; shopper receives grocery reimbursement + delivery fee in one transfer
16. If user does not confirm in 10 minutes → auto-capture fires (OrderAgent DO alarm)
17. AI updates pantry memory from delivered items
18. If order was cooking-intent-triggered → "Ready to start cooking?" prompt appears
```

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Order state | OrderAgent Durable Object | Session-scoped, survives eviction, WebSocket relay |
| Shared tables | Supabase Postgres | orders, order_items, shoppers, disputes — shared across all users |
| Escrow + payout | Stripe Connect | PaymentIntent manual capture for authorization hold; Express accounts for shopper payout |
| User constraint data | Orchestrator DO SQLite | Read at order creation, cached in OrderAgent for scanner enforcement |
| Delivery photos | Cloudflare R2 | Shopper uploads; user views; retained for dispute window |
| Routing intelligence | Ground `location_signal_summary` + `product_sighting` | Price and availability signals for multi-store routing |
| Shopper KYC | Veriff (or equivalent) | ID verification + criminal background check |

---

## Files in This Folder

| File | What it covers |
|---|---|
| `00-overview.md` | This file — system overview, architecture, stack |
| `01-order-creation.md` | AI list generation, user approval, delivery window |
| `02-shopper-platform.md` | Shopper onboarding, KYC, Stripe Connect setup, app mode |
| `03-constraint-travel.md` | How the user's constraint profile enforces on the shopper's scanner |
| `04-live-scan-session.md` | Shared real-time scanning between user and shopper |
| `05-escrow-payment.md` | Wallet, escrow hold, payout, service fee, refund logic |
| `06-shopper-quality.md` | Scan accuracy score, trust relationship, suspension |
| `07-ground-contribution.md` | Shoppers building Ground finds as a side effect of every order |
| `08-smart-routing.md` | Ground + product_sighting multi-store route planning |
| `09-standing-order.md` | Weekly pantry replenishment with zero management |
| `10-cooking-intent-trigger.md` | Cooking session or recipe save triggering a grocery order |
| `11-for-others.md` | Ordering for grandparents, family members, non-users |
| `12-dispute-resolution.md` | Wrong/missing items, photo proof, automatic refunds |
| `13-data-model.md` | All SQL tables for the shopping system |
| `14-shopper-ai-assistant.md` | Voice + vision AI for the shopper during the shopping session — same Gemini Live stack as cooking session |
| `15-checkout-payment.md` | Shopper pays with registered Bela card; user PaymentIntent is captured after delivery confirmation |

---

## What Is Explicitly Not in Scope

- Turn-by-turn navigation engine (the shopper app shows a route on a map; navigation is handled by the phone's native maps app via deep link)
- A delivery fleet or owned logistics (all shoppers are independent gig workers)
- Subscription to specific stores or exclusive store partnerships
- Restaurant / prepared food delivery (grocery only — this is a pantry and ingredient service)
- Real-time tracking of the shopper's location (the user sees order status updates, not a live dot on a map — privacy for shoppers)
