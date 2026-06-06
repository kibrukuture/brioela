# Bela — Checkout Payment

## What This File Covers

Store checkout, receipt proof, door proof, confirmation, and capture.

## Sources

- `implementable-specs/bela/15-checkout-payment.md`
- `implementable-specs/bela/05-escrow-payment.md`

## Final Decision

- no Stripe Issuing
- no virtual card
- no user wallet
- shopper pays with registered Bela card
- user PaymentIntent is manual-capture hold

## Store Receipt Scan

Confirms:

- actual total
- timestamp
- merchant/place
- card last4 matches registered Bela card
- OCR extracted line items

Shopper cannot advance to delivery until store receipt scan succeeds or manual review is triggered.

## Door Receipt Scan

At delivery, shopper scans receipt/photo again.

This proves physical arrival and starts user confirmation timer.

## User Confirmation

- full-screen prompt
- 10-minute response window
- auto-capture if no response
- 30-minute dispute window after confirmation/auto-confirm

## Capture

Capture actual amount after confirmation/auto-confirm.

Then transfer shopper reimbursement + delivery fee through Connect Express.
