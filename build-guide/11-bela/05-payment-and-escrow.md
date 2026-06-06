# Bela — Payment And Escrow

## What This File Covers

Payment hold, capture, refund, and shopper payout model.

## Sources

- `implementable-specs/bela/05-escrow-payment.md`
- `implementable-specs/bela/15-checkout-payment.md`

## Final Decision

- No wallet.
- No Stripe Issuing.
- No Brioela-held user balance.
- Use Stripe PaymentIntent manual capture.
- Use Stripe Connect Express transfer for shopper payout.

## Flow

1. Shopper accepts order.
2. Create PaymentIntent authorization hold.
3. Shopper shops and pays with registered Bela card.
4. Store receipt scan confirms total.
5. Door scan starts confirmation timer.
6. User confirms or 10-minute auto-capture fires.
7. Capture actual amount.
8. Transfer grocery reimbursement + delivery fee to shopper.

## Tips

Tips are separate PaymentIntents and transfer 100% to shopper.
