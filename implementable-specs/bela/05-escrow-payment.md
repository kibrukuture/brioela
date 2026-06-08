# Bela — Escrow and Payment

## The Money Flow

```
User's card (authorization hold placed at order acceptance)
        │
        ▼
  Hold: grocery estimate + 20% buffer + delivery fee + platform fee
        │
  Shopper shops, pays at store with their dedicated Bela card
        │
  Shopper scans receipt at store → actual total confirmed
        │
  Shopper delivers → scans receipt at door → user sees confirmation screen
        │
  User confirms in app (10-minute window)
        │
        ├──► platform captures: actual grocery total + delivery fee + platform fee
        ├──► Stripe Connect transfer: shopper receives grocery reimbursement + delivery fee
        └──► platform retains: service fee
```

Money is locked from order acceptance. Shopper is out of pocket for grocery cost from store checkout until user confirms delivery (typically 15–45 minutes for a local order). Auto-capture fires after 10 minutes if user does not respond.

---

## No Wallet, No Pre-Funded Balance

Brioela does not hold user money. There is no Brioela wallet. The user's payment method (debit or credit card) is stored via Stripe Customer. When an order is accepted by a shopper, Stripe places an authorization hold on the user's card. The money stays in the user's bank — it is reserved and cannot be spent elsewhere, but it has not moved. The hold disappears if the order is cancelled before shopping begins. The hold becomes a charge only when the order completes.

This is the same mechanism hotels use for incidental holds. It requires no money transmission license. Brioela never holds funds — Stripe holds the authorization on behalf of the user's bank.

---

## Authorization Amount

When a shopper accepts an order, the `PaymentIntent` is created immediately with `capture_method: 'manual'`:

```typescript
const intent = await stripe.paymentIntents.create({
  amount:          estimatedTotalCents,    // see breakdown below
  currency:        'usd',
  customer:        user.stripeCustomerId,
  payment_method:  user.stripePaymentMethodId,
  capture_method:  'manual',
  confirm:         true,
  metadata: {
    order_id:    order.orderId,
    shopper_id:  order.shopperId,
    user_id:     order.userId,
  },
})
```

The `estimatedTotalCents` is:

| Component | Amount |
|---|---|
| Estimated grocery total (from AI list + Ground price data) | $52.00 |
| 20% buffer (price variance, unit size differences) | $10.40 |
| Delivery fee (distance + item count — fixed at order creation) | $7.00 |
| Platform service fee (10% of grocery estimate) | $5.20 |
| **Total authorized on user's card** | **$74.60** |

The user sees this total on the order confirmation screen before confirming the order. They are not charged $74.60 — they are authorized up to $74.60. The actual capture is based on the real receipt total.

The `orders` table is updated immediately with: `stripe_payment_intent_id`, `authorization_amount_cents`, `authorized_at`.

---

## Shopper Checkout at the Store

The shopper pays at the grocery store till using their registered Bela card — a dedicated debit card registered during onboarding and used exclusively for Bela orders. See `02-shopper-platform.md` and `15-checkout-payment.md` for the dedicated card model.

After paying, the shopper scans the receipt in the app. The receipt scan:
- Confirms the actual total paid by the shopper
- Verifies the last-4 of the card used matches the registered Bela card
- Locks in per-item prices for Ground price intelligence
- Stores the receipt image in Cloudflare R2 as dispute evidence

**If actual receipt total exceeds the estimated grocery amount but is within the 20% buffer:** no action needed — the authorization already covers it.

**If actual receipt total approaches or exceeds the authorization buffer:** the platform calls `incrementAuthorization` before the shopper leaves the store:

```typescript
await stripe.paymentIntents.incrementAuthorization(intent.id, {
  amount: newTotalCents,   // actual grocery + fees, recalculated from receipt
})
```

This must fire while the shopper is still at the store, before they scan the door receipt. The shopper gets an in-app message: "Budget updated to match your receipt — you're good to go."

The shopper cannot advance to delivery mode until the receipt scan succeeds.

---

## Delivery and User Confirmation

At the door:
1. Shopper taps "I've arrived"
2. Shopper scans receipt again (second scan — proof of physical presence with the order)
3. User receives a full-screen prompt immediately:

```
Your order is here ✓

12 items · $52.40

[ View receipt ]

Confirm delivery?
[ Yes, I have everything ]    [ Something's wrong ]

Auto-confirms in 9:58...
```

**User taps "Yes, I have everything":**
- `orders.status` → `completed`
- `paymentIntents.capture()` fires with actual grocery total + delivery fee + platform fee
- Stripe Connect transfer created: shopper receives grocery cost reimbursement + delivery fee (combined in one transfer)
- Platform retains service fee

**User taps "Something's wrong":**
- `orders.status` → `disputed`
- `paymentIntents.capture()` does NOT fire
- Authorization hold remains
- Dispute flow opens — see `12-dispute-resolution.md`
- Shopper payout held until resolution

**User does not respond within 10 minutes:**
- BelaOrderAgent DO alarm fires (set at door-scan time)
- Auto-capture executes: same as user confirming
- `orders.status` → `completed`
- User can still raise a dispute within 30 minutes of auto-capture

---

## Service Fee Structure

The platform service fee is calculated on the actual grocery total (from receipt), not the estimate.

| Grocery total (actual) | Platform service fee | Shopper delivery fee |
|---|---|---|
| Under $20 | 15% | Flat — set at order creation |
| $20–$50 | 12% | Flat — set at order creation |
| $50–$100 | 10% | Flat — set at order creation |
| Over $100 | 8% | Flat — set at order creation |

The delivery fee is fixed at order creation and shown to the user before they confirm the order. It is based on distance and item count. It is separate from the platform service fee. The shopper always knows their earnings before accepting.

Stripe processing fees (~2.9% + $0.30 per charge, ~0.25% per payout) are absorbed by the platform — they come out of the platform service fee. The shopper receives 100% of the quoted delivery fee.

---

## Shopper Payout Timing

After capture:
- Stripe Connect transfer is created immediately
- Shopper sees "Payment incoming" in their earnings screen
- Standard payout to bank account: 2 business days
- Instant payout (shopper opts in during onboarding): funds arrive within minutes; platform absorbs the Stripe instant payout fee (~1%) for the first 90 days, after which the shopper can choose speed

The shopper is never waiting on Brioela's action after the user confirms — the transfer fires immediately on capture.

---

## Tip Flow

At delivery confirmation, the user sees a tip prompt after confirming:

```
Tip your shopper?

  [ $2 ]  [ $4 ]  [ $6 ]  [ Custom ]  [ No tip ]
```

Tips are a separate `PaymentIntent` charged to the user's card immediately (not from the authorization — tips are additive). Transferred 100% to the shopper via Stripe Connect with no platform fee deducted.

---

## Cancellation and Refunds

**Before shopper starts shopping** (`status = 'accepted'`):
- Authorization hold is released: `paymentIntents.cancel()`
- No charge. User sees the pending hold disappear from their bank within minutes (bank-dependent timing).

**After shopper starts shopping** (`status = 'shopping'`):
- Cancellation not allowed. Shopper has invested time and travel.
- User can only dispute after delivery.

**Items unavailable** (shopper marked items as out-of-stock):
- Capture amount is the actual receipt total (unavailable items were not purchased, so they are not on the receipt).
- User is automatically not charged for items that were not delivered. No dispute needed.

**Dispute refund:**
- If dispute resolves in user's favor, the relevant portion is refunded via `paymentIntents.refund()`.
- Full disputes (order never arrived, all items wrong): full refund, shopper receives no payout for that order.

---

## Financial Ledger

All payment events are appended to `order_payment_events`. Append-only — no row is ever updated or deleted.

```sql
order_payment_events (
  id             uuid primary key,
  order_id       text not null references orders(order_id),
  kind           text check(kind in (
    'authorization_placed',
    'authorization_incremented',
    'captured',
    'connect_transfer',
    'tip_charge',
    'tip_transfer',
    'authorization_released',
    'refund'
  )),
  amount_cents   int not null,
  currency       text not null default 'usd',
  stripe_ref     text,    -- PaymentIntent ID, transfer ID, or refund ID
  created_at     timestamptz not null default now()
)
```

There is no wallet balance table. No ledger sum queries. Every financial event for an order is in `order_payment_events`. The user's card and Stripe are the source of truth — Brioela's ledger is an audit log, not a balance system.
