# Bela — Overview

## What Bela Is

**Bela** is Brioela's personal grocery delivery service — a brand name, not a feature label. Users say "I'll Bela it." Media writes "Bela by Brioela." The name is warm, short, and its own thing.

What it does: the user funds their Brioela wallet, the AI builds the grocery list from their cooking history, a KYC-verified gig shopper goes to the store with a voice + camera AI assistant in their ear, buys exactly the right things using the Brioela scanner, taps to pay at checkout via Apple Pay or Google Pay funded from the user's wallet, and delivers to the door.

Payment is held in escrow from the moment the order is accepted. It releases to the shopper only when delivery is confirmed. The app takes a service fee. The wallet stays on Stripe.

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
Wallet + escrow UI          Delivery confirmation          Stripe Connect (escrow + payout)
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
6. Escrow hold is placed on user's wallet (Stripe PaymentIntent created)
7. Stripe Issuing virtual card provisioned to shopper's Apple Pay / Google Pay (order budget pre-loaded)
8. Shopper navigates to the store using the smart route (Ground + product_sighting data)
9. Shopper AI assistant (voice + camera) activates — shopper talks to the AI throughout the shop
10. Shopper scans each product → constraint check → user sees result (live scan-together) → AI confirms aloud
11. Shopper taps phone at checkout till → Apple Pay / Google Pay → Stripe Issuing card pays from user's wallet
12. Shopper completes shopping → navigates to delivery address
13. Shopper takes a photo of all items → submits delivery
11. User confirms receipt → escrow releases → Stripe Connect payout to shopper
12. App takes service fee → shopper receives net payout
13. AI updates pantry memory from delivered items
14. If order was cooking-intent-triggered → "Ready to start cooking?" prompt appears
```

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Order state | OrderAgent Durable Object | Session-scoped, survives eviction, WebSocket relay |
| Shared tables | Supabase Postgres | orders, order_items, shoppers, disputes — shared across all users |
| Wallet + escrow | Stripe Connect | PaymentIntent for escrow, Express accounts for shopper payout |
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
| `15-checkout-payment.md` | Stripe Issuing virtual card → Apple Pay / Google Pay at the store till, funded from user's wallet escrow |

---

## What Is Explicitly Not in Scope

- Turn-by-turn navigation engine (the shopper app shows a route on a map; navigation is handled by the phone's native maps app via deep link)
- A delivery fleet or owned logistics (all shoppers are independent gig workers)
- Subscription to specific stores or exclusive store partnerships
- Restaurant / prepared food delivery (grocery only — this is a pantry and ingredient service)
- Real-time tracking of the shopper's location (the user sees order status updates, not a live dot on a map — privacy for shoppers)
