# Bela — Shopper Checkout (Dedicated Bela Card + Receipt Scan)

## The Model

The shopper pays at the grocery store till using their own dedicated debit card — their "Bela card" — registered during onboarding. They pay like a normal customer. They scan the receipt with the Brioela scanner at the store. They scan it again at the user's door. The user confirms. Money moves.

No Stripe Issuing. No virtual cards. No Apple entitlement approval. No push provisioning. No approval process of any kind. The shopper is out of pocket for the grocery cost from checkout until the user confirms delivery (typically 15–45 minutes for a local order). This is the same model used by DoorDash's Red Card program and early Instacart.

---

## The Dedicated Bela Card

### What It Is

During shopper onboarding (after KYC and Stripe Connect setup — see `02-shopper-platform.md`), the shopper registers a dedicated debit card as their Bela card. This is:

- Any debit card they designate for Bela shopping: a dedicated bank account debit card, or a prepaid Visa/Mastercard
- A separate card from their personal primary debit or credit card
- Registered via Stripe's payment method tokenization — Brioela stores the Stripe `PaymentMethod` ID and the card last-4 only, never the raw card number

The card is labeled "Bela Shopping Card" in their shopper profile.

### Why a Dedicated Card (Not Their Personal Card)

- **Tax clarity**: all Bela purchases on one card — easy to reconcile with their earnings statements
- **Dispute evidence**: any charge on the Bela card can be traced to a specific order via receipt scan last-4 verification
- **Professional separation**: Brioela's scanner verifies the card used matches the registered Bela card — this makes the receipt tamper-evident
- **Shopper protection**: personal spending never shows up in Bela's order records; Bela purchases never show up in personal spending history

### Contractual Requirement

In the shopper terms of service, the shopper agrees:
- The registered Bela card is used exclusively for Bela orders during active shopping sessions
- No personal purchases on this card while they have an active Bela order in `shopping` status
- Any charge on the Bela card that does not correspond to a scanned order receipt triggers a review

This is a contractual policy, not a technical lock. The receipt scan enforces it indirectly: the scanner verifies last-4 of the card on the receipt matches the registered Bela card. A purchase on the wrong card produces a mismatch and blocks the order from advancing.

### Registering the Card During Onboarding

```typescript
// Shopper onboarding — Step 5: Register Bela card
// Uses Stripe SetupIntent to tokenize the card without charging it
const setupIntent = await stripe.setupIntents.create({
  customer:    shopper.stripeCustomerId,
  usage:       'off_session',
  metadata: {
    shopper_id: shopper.shopperId,
    purpose:    'bela_shopping_card',
  },
})

// Client uses stripe.confirmCardSetup(setupIntent.client_secret)
// to present card entry UI — no raw card number stored server-side

// On completion, save the PaymentMethod ID and last-4:
await db.shoppers.update({
  where:  { shopper_id: shopper.shopperId },
  data: {
    bela_card_payment_method_id: paymentMethod.id,
    bela_card_last4:             paymentMethod.card.last4,
    bela_card_brand:             paymentMethod.card.brand,
  },
})
```

---

## Receipt Scan at the Store

After paying at checkout, the shopper opens the Brioela scanner and scans the receipt — paper receipt or POS screen.

**What the scan does:**

1. GPT-4o mini vision extraction reads the receipt: merchant name, line items, quantities, prices, total, card last-4 used
2. **Card verification**: last-4 from receipt must match `shoppers.bela_card_last4`. Mismatch blocks the order from advancing and flags the order for review.
3. **Amount check**: actual total is compared against the PaymentIntent authorization:
   - Actual total within authorization: nothing to do — hold already covers it
   - Actual total approaches or exceeds authorization: `paymentIntents.incrementAuthorization()` fires immediately, before the shopper leaves the store (shopper sees "Budget updated — you're good to go")
4. **Ground price contribution**: per-item prices are contributed to the Ground price intelligence system, anonymized
5. **Receipt image stored**: uploaded to Cloudflare R2, tagged with `order_id` — retained for the dispute window (30 days)

**The shopper cannot advance to delivery mode until the store receipt scan succeeds.**

If receipt vision extraction fails (faded receipt, long paper roll, crumpled):
- Fallback: shopper takes a photo, server-side GPT-4o mini vision extraction runs with a higher quality pipeline (2–3 second latency)
- If extraction still fails: shopper manually enters the total. Receipt photo is required. Order is flagged for operations review. Shopper is paid after review (within 2 hours). Repeated manual-entry use triggers a quality flag.

---

## Receipt Scan at the Door

When the shopper arrives at the delivery address and taps "I've arrived," the app shows:

```
Scan the receipt at handover

Show the receipt to the user as you hand over the order.
This starts their 10-minute confirmation window.
```

The shopper scans the receipt again. This:
- Creates a second timestamped receipt record (store scan vs door scan — same receipt, different locations and times)
- Confirms the shopper is physically present at the delivery address with the actual order
- Triggers the user's confirmation screen immediately

**The two-scan system (store + door) is Bela's evidence layer.** Both timestamps, both images, same receipt. A shopper cannot fake delivery without physically being at the store with the goods, then physically being at the delivery address with the same receipt. This is stronger dispute evidence than anything competitors have — it is why Bela's dispute model in `12-dispute-resolution.md` can auto-resolve many cases without human review.

---

## User Confirmation Screen

Fires immediately when the door scan completes. Full-screen takeover on the user's phone:

```
Your order is here ✓

Delivered by [Shopper first name]

12 items · $52.40 total

[ View receipt ]

Confirm delivery?
[ Yes, I have everything ]    [ Something's wrong ]

Auto-confirms in 9:58...
```

If the user taps "Yes": capture fires and shopper is paid. See `05-escrow-payment.md`.
If the user taps "Something's wrong": dispute opens, no capture. See `12-dispute-resolution.md`.
If the timer reaches zero: auto-capture fires. User can still dispute within 30 minutes.

---

## Checkout Flow Summary (Shopper Experience)

```
Shopper scans last item
        │
        ▼
AI assistant: "Shopping done — 12 of 12 items found. Head to checkout."
        │
        ▼
Shopper walks to checkout till
        │
        ▼
Shopper pays with Bela card (tap, chip, or swipe)
        │
        ▼
Shopper opens scanner → scans receipt
        │
        ▼
"Receipt confirmed. $52.40. Head to [user neighborhood]."
        │
        ▼
Shopper travels to delivery address
        │
        ▼
Shopper arrives → taps "I've arrived"
        │
        ▼
Shopper shows receipt, scans it, hands over items
        │
        ▼
User confirmation screen fires on their phone
        │
        ▼
User confirms → shopper payout initiated immediately
```

The shopper pays at the till like a normal customer. No NFC tap from the Brioela app. No virtual card. No Wallet setup. Just their own card, their own phone, and the Brioela scanner for the receipt.

---

## Legality

This model is legally clean:

- **Purchasing agent model**: the shopper acts as a purchasing agent for the user, a standard arrangement in service contracts. No special license required.
- **Expense reimbursement**: the shopper's Bela card payment is an advance purchase that is reimbursed on delivery confirmation. This is standard expense reimbursement — used in business travel, corporate cards, and all contractor models globally.
- **No money transmission license**: Brioela never holds or moves user funds directly. Stripe holds the authorization on the user's bank and moves money on Brioela's API instruction. The platform's role is instruction, not custody.
- **Dedicated card requirement**: a contractual employment term in the shopper agreement, not a financial product. No banking license required to mandate a card designation.
- **Precedent**: DoorDash Red Card program (US), early Instacart (US), multiple regional delivery services in Europe and Africa operate on this model.

**Geographic note**: This model works in any country where Stripe Connect and Stripe PaymentIntents operate. For Ethiopia and other regions where Stripe is not available, the fallback payment collection method is Telebirr with manual shopper reimbursement via local bank transfer. Phase 1 Africa design is documented separately.
