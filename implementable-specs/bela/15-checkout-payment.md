# Bela — Checkout Payment (Apple Pay / Google Pay)

## The Problem

The shopper fills the basket, walks to the checkout till, and needs to pay. The money is the user's — held in escrow in the Brioela wallet. The shopper cannot pay from their own bank account and get reimbursed later (that creates cash flow risk and trust issues). The shopper needs a payment method at the till that is funded by the user's wallet at that exact moment, with no manual transfer, no cash handling, no awkwardness.

The solution: **Stripe Issuing virtual card** — a single-use virtual Visa/Mastercard card, pre-loaded with the order amount from escrow, provisioned to the shopper's Apple Pay or Google Pay wallet for this order only. The shopper taps to pay at checkout. Done.

---

## How Stripe Issuing Works Here

Stripe Issuing allows Brioela to create virtual payment cards programmatically. These are real Visa/Mastercard cards with a BIN, an expiry, a CVV — they work at any merchant terminal that accepts contactless payment.

**The flow:**

1. When the shopper accepts the order and the escrow hold is placed (`orders.status → 'accepted'`), the OrderAgent DO creates a Stripe Issuing virtual card via the Stripe API:

```typescript
const card = await stripe.issuing.cards.create({
  currency:     'usd',      // or local currency
  type:         'virtual',
  status:       'active',
  spending_controls: {
    spending_limits: [{
      amount:   order.escrowHoldAmountCents + bufferCents,
      interval: 'per_authorization',
    }],
    blocked_categories: [],   // no category restrictions — the shopper buys grocery items
  },
  metadata: {
    order_id:   order.orderId,
    shopper_id: order.shopperId,
    user_id:    order.userId,
  },
})
```

The spending limit is set to the escrow hold amount (order estimate + 10% buffer). The card cannot be charged beyond this limit. After the order completes, the card is immediately cancelled — it is single-use per order.

2. The shopper receives a push notification when the card is ready (immediately after order acceptance):

```
Your order payment card is ready

Add it to Apple Pay or Google Pay to pay at checkout.
It's pre-loaded with the order budget.

[ Add to Apple Pay ]  [ Add to Google Pay ]
```

3. The shopper taps "Add to Apple Pay" (or Google Pay). The card is provisioned to their device wallet via the native SDK:
   - **Apple Pay**: `PKAddPaymentPassRequest` / PassKit API — the card details are pushed to Wallet without the shopper seeing the raw card number
   - **Google Pay**: Google Pay Issuer API / push provisioning — same result on Android

4. At checkout, the shopper taps their phone to the NFC terminal. Apple Pay / Google Pay handles the contactless transaction. The Stripe Issuing card is charged.

5. Stripe sends a webhook to Brioela: `issuing_transaction.created` — Brioela receives the real charged amount.

6. The real charged amount feeds into the order's final total reconciliation:
   - If the shopper bought all items: actual total ≈ estimated total (within the 10% buffer)
   - If items were unavailable: actual total < estimated total → the difference is released back to the user's wallet
   - The card spending limit prevents any overcharge beyond the escrow buffer

---

## Apple Pay Integration in the Shopper App

The shopper app uses **React Native** (same as the main Brioela app). Apple Pay in React Native is handled via `@stripe/stripe-react-native` which includes the PassKit push provisioning bridge.

Push provisioning flow:
```typescript
import { useStripe } from '@stripe/stripe-react-native'

const { canAddCardToWallet, addToWallet } = useStripe()

// Check if the device supports adding cards
const { canAddCard } = await canAddCardToWallet({
  primaryAccountIdentifier: card.id,  // Stripe Issuing card ID
})

if (canAddCard) {
  // Trigger the native Add to Wallet sheet
  await addToWallet({
    cardHolderName:           shopper.displayName,
    primaryAccountIdentifier: card.id,
    // Ephemeral key for verification (server-generated per Stripe docs)
    token: ephemeralKey,
  })
}
```

The "Add to Apple Pay" button in the shopper app triggers this flow. The native Wallet sheet appears. The shopper confirms. The card is in Apple Pay.

**Requirements:**
- Apple Pay push provisioning requires an Apple-approved entitlement from Brioela's developer account: `com.apple.developer.payment-pass-provisioning`
- This entitlement requires a separate application to Apple — it is not automatically available. Apple reviews the use case before granting it. Brioela's case (single-use order cards for gig shoppers) is a standard approved use case. Estimated approval: 2–4 weeks.

---

## Google Pay Integration in the Shopper App

Google Pay push provisioning in React Native uses the same `@stripe/stripe-react-native` package on Android.

```typescript
// Android: check Google Pay availability
const { isGooglePaySupported } = useGooglePay()
const supported = await isGooglePaySupported({ testEnv: false })

if (supported) {
  // Initialize Google Pay
  await initGooglePay({
    testEnv: false,
    merchantName: 'Brioela',
    countryCode:  'ET',   // or user's market country
    billingAddressConfig: { format: 'MIN', isRequired: false },
  })
}
```

For push provisioning (adding a card to Google Pay, not using Google Pay for a one-time payment):
- Use Google Pay Issuer API (separate from the payments API)
- Stripe provides a server-side `issuing_cards.pushProvision()` method that generates the push provisioning payload
- Delivered to the Android app as a Stripe ephemeral key + card details bundle
- The native Google Pay SDK provisions the card to the device wallet

**Requirements:**
- Google Pay push provisioning requires approval from Google for the issuer program. Stripe Issuing handles most of this — Brioela's Stripe account must be on the Issuing program and approved for push provisioning. Stripe provides guidance on the approval process as part of their Issuing onboarding.

---

## What Happens If the Shopper Cannot Add the Card

Not every device supports push provisioning (older Android versions, devices without NFC, devices where Google/Apple Pay is not set up). Fallback options:

**Fallback 1: Show card details in-app**
The shopper can view the virtual card number, expiry, and CVV within the shopper app (behind biometric auth). They manually enter these at checkout — works for any till that accepts card-not-present entry (rare at grocery stores, but possible at some markets).

**Fallback 2: Shopper pays own card, gets reimbursed**
The shopper pays from their own card and submits the receipt. Brioela verifies the receipt (total ≤ order estimate, same items), then transfers the amount to the shopper's Stripe Connect account immediately rather than at delivery. This is the pre-Stripe Issuing model — it works but creates cash flow risk for the shopper (they are out of pocket until receipt verification).

Fallback 2 is a last resort. The target is that 90%+ of active shoppers use Apple Pay or Google Pay with push provisioning.

---

## Receipt Capture and Price Reconciliation

After paying at checkout, the shopper taps "I've paid — heading to delivery" in the app. At this point:

1. The Stripe Issuing transaction webhook has already arrived (near-real-time from Stripe)
2. The actual charged amount is now known
3. The OrderAgent DO compares the actual charge to the escrow hold:
   - Actual ≤ escrow hold: escrow captures for actual amount + service fee; remainder released to user wallet
   - Actual > escrow hold (should not happen — spending limit prevents this, but edge cases exist for tax, rounding): the card is declined at that amount and the shopper is asked to remove one item

4. Optional receipt photo: the shopper can photograph the receipt (paper or screen). This feeds:
   - Per-item price data to the Ground price intelligence system (item prices visible in the receipt)
   - Confirmation of exact items purchased for dispute evidence

The receipt photo is not required. The Stripe Issuing transaction is the source of truth for the charged amount, not the receipt photo. The photo is supplementary evidence for disputes and Ground price updates.

---

## Card Security

The Stripe Issuing virtual card is:
- **Single-use per order**: cancelled immediately after the order reaches `in_transit` status (shopper has left the store). The card cannot be used for any subsequent purchase.
- **Amount-capped**: the spending limit is the escrow hold amount. Overspend is impossible.
- **Order-bound**: the card `metadata` contains `order_id` and `shopper_id` — any transaction on this card is traceable to the exact order and shopper.
- **Time-limited**: the card expires 24 hours after creation (a shopping trip should never take longer than this). If the shopper is delayed and the card expires, a new card is issued upon request.

If the card is charged for an amount significantly different from the expected order total (> 20% variance): the transaction is flagged for manual review in Brioela's operations dashboard. This catches cases where a shopper uses the card for personal purchases (the card should only be charged at the specific store in the routing plan — merchant category and location are verified against the Stripe transaction data).

---

## Checkout Flow Summary (Shopper Experience)

```
Shopper finishes scanning all items
        │
        ▼
AI assistant: "Shopping done — 12 of 12 items found. Head to checkout."
        │
        ▼
Shopper walks to checkout till
        │
        ▼
Shopper taps their phone to the NFC terminal
(Apple Pay / Google Pay — Brioela order card)
        │
        ▼
Beep. Payment approved.
        │
        ▼
AI assistant: "Paid. Total was $42.30. Head to [user's address]."
        │
        ▼
Shopper taps "Heading to delivery" in the app
Order status → 'in_transit'
Virtual card is cancelled
Stripe transaction logged to order_payment_events
```

The shopper never opens a wallet app manually, never types a card number, never deals with cash. They tap their phone once and keep moving.
