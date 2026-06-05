# Bela — Escrow and Payment

## The Money Flow

```
User wallet (pre-funded)
        │
        ▼
  Escrow hold placed                  ← when shopper accepts order
        │
        ▼
  Shopper delivers + user confirms
        │
        ├──► Shopper payout (net of service fee)   ← Stripe Connect transfer
        └──► Brioela service fee                   ← retained by platform
```

Money moves twice: once to create the hold, once to release it. Between those two events, neither the user nor the shopper can touch it. The user cannot cancel without consequence after the shopper starts shopping. The shopper cannot be stiffed on a completed delivery.

---

## Brioela Wallet

The Brioela wallet is the user's stored balance on the platform. It is powered by Stripe — specifically a Stripe Customer with a payment method on file and a balance tracked in Brioela's own database (not a Stripe balance — a Brioela ledger).

### Funding the Wallet

The user adds money to their wallet from a linked payment method (card or bank account):
- Minimum top-up: $5 (or local equivalent)
- Top-up is a Stripe PaymentIntent for the top-up amount
- On success: `wallet_transactions` table is updated with a `credit` row
- The wallet balance is the sum of all `wallet_transactions` for this user

The wallet balance is stored in the Orchestrator DO's `agent_state` table as a cached value and in Supabase `wallet_balance` table as the source of truth. The Orchestrator DO updates its cache from Supabase at session start. Discrepancies between the two (from any failed sync) are resolved in favor of the Supabase value.

### Wallet Balance Display

The wallet balance is shown:
- On the main home screen (small balance chip in the corner)
- On the Bela tab (prominently — the user must understand available balance before ordering)
- During order creation (the estimated total is shown against the available balance; if balance is insufficient, the user is prompted to top up before confirming)

---

## Escrow Hold

When a shopper accepts an order:

1. The `OrderAgent` DO sends a request to the payment service to place an escrow hold
2. The hold is a Stripe PaymentIntent in `status = 'requires_capture'` — funds are reserved but not yet moved
3. The hold amount is the order estimated total plus a 10% buffer (to cover if the shopper finds items that run slightly over the estimate due to price variance)
4. The `orders` table is updated with: `stripe_payment_intent_id`, `escrow_hold_amount`, `escrow_hold_at`
5. The user's displayed wallet balance is reduced by the hold amount — they cannot spend held funds on other orders

If the Stripe hold fails (insufficient wallet balance):
- The shopper is notified: "Order cannot proceed — payment hold failed"
- The order returns to `pending`
- The user is notified: "Please top up your wallet — your balance is too low to hold for this order"

---

## Service Fee Structure

Brioela takes a service fee on every completed order. The fee structure:

| Order total | Platform service fee | Shopper receives |
|---|---|---|
| Under $20 | 12% | 88% of order total |
| $20–$50 | 10% | 90% of order total |
| $50–$100 | 8% | 92% of order total |
| Over $100 | 6% | 94% of order total |

The shopper also keeps 100% of any tip the user adds at confirmation (tips are outside the order total and processed separately).

The service fee covers: platform infrastructure, KYC verification cost amortization, dispute resolution overhead, and Stripe processing fees.

**Stripe processing fees** are taken from the platform service fee — they do not reduce the shopper's payout. The platform absorbs Stripe's cut.

---

## Delivery Confirmation and Payout

When the shopper marks the order as delivered:
- The `orders.status` → `delivered`
- The user receives a notification: "Your order has been delivered — confirm receipt"

**Confirmation window: 10 minutes**

The user has 10 minutes to confirm delivery. If they confirm:
1. `orders.status` → `completed`
2. The Stripe PaymentIntent is captured (funds actually move from escrow)
3. The actual order total (which may differ from the estimate if some items were unavailable) is calculated from the final `order_items` list
4. Stripe Connect transfer is initiated: shopper receives net payout (order total minus service fee)
5. Any over-captured amount (the 10% buffer, minus actual variance) is immediately released back to the user's wallet

If the user does NOT confirm within 10 minutes:
- Auto-confirm triggers
- Same payment flow as above
- The user can still raise a dispute within 30 minutes of auto-confirm (see `12-dispute-resolution.md`)

If the user raises a dispute instead of confirming:
- `orders.status` → `disputed`
- The Stripe PaymentIntent is NOT captured during dispute
- Funds remain in escrow until dispute resolution
- The shopper payout is held until resolution

---

## Shopper Payout Timing

After a successful `completed` status:
- The Stripe Connect transfer is created immediately
- Stripe's standard payout timing to the shopper's bank account: 2 business days for standard payout, instant for Stripe Instant Payouts (available in markets where Stripe supports it)

Shoppers can see their pending payouts in the Shopper Mode earnings screen. A payout shows as "processing" until the bank transfer settles.

---

## Tip Flow

At delivery confirmation, the user sees:

```
Order delivered ✓

[Product list summary]

Total: $41.20

Add a tip for your shopper?

  [ $2 ]  [ $4 ]  [ $6 ]  [ Custom ]  [ No tip ]
```

Tips are processed as a separate Stripe PaymentIntent (not from escrow — from the user's wallet directly at confirmation time). Tips are transferred 100% to the shopper via Stripe Connect with no platform fee deducted.

---

## Refunds

Refunds come from two sources:

**Automatic partial refund**: if items were unavailable and marked so by the shopper, the actual order total is automatically less than the escrow hold. The difference is released back to the user's wallet immediately at completion. No dispute needed — this is a normal outcome.

**Dispute refund**: if a dispute is resolved in the user's favor (wrong item, missing item that was marked as delivered), the relevant portion of the captured funds is returned to the user's wallet via Stripe refund. See `12-dispute-resolution.md` for resolution logic.

**Full refund**: if an order is cancelled before the shopper starts shopping (status is `accepted` but not yet `shopping`), the escrow hold is released immediately and the user's wallet balance is fully restored. No charge occurs.

---

## Financial Ledger Tables

All money movements are appended to `wallet_transactions` and `order_payment_events` in Supabase. These are append-only logs — no row is ever updated or deleted.

```sql
wallet_transactions (
  id             uuid primary key,
  user_id        text not null,
  kind           text check(kind in ('credit','debit','hold','release','refund')),
  amount_cents   int not null,
  currency       text not null,
  stripe_ref     text,       -- PaymentIntent ID or transfer ID
  order_id       text,       -- linked order if applicable
  created_at     timestamptz not null default now()
)

order_payment_events (
  id             uuid primary key,
  order_id       text not null references orders(order_id),
  kind           text,       -- 'hold_placed', 'hold_released', 'captured', 'transfer', 'tip', 'refund'
  amount_cents   int,
  stripe_ref     text,
  created_at     timestamptz not null default now()
)
```

The wallet balance for a user is: `SUM(amount_cents) WHERE user_id = ? AND kind IN ('credit','release','refund') MINUS SUM(amount_cents) WHERE user_id = ? AND kind IN ('debit','hold')`.

This is recalculated on every wallet display render. The cached value in `wallet_balance` table is used for fast reads and is reconciled with the ledger sum on every Curator pass.
