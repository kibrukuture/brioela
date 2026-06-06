# Bela — Shopper Platform

## What This File Covers

Shopper onboarding, verification, Connect account, and dedicated Bela card registration.

## Sources

- `implementable-specs/bela/02-shopper-platform.md`
- `implementable-specs/bela/15-checkout-payment.md`

## Shopper Onboarding

1. Application.
2. Phone/email verification.
3. Legal identity.
4. KYC.
5. Background check.
6. Stripe Connect Express.
7. Dedicated Bela card setup.
8. Status becomes `active`.

## Shopper Status

- `pending`
- `active`
- `suspended`
- `banned`

## Dedicated Bela Card

The shopper pays in store with their own registered Bela debit/prepaid card.

No Stripe Issuing. No virtual card.

Required shopper fields:

- `bela_card_payment_method_id`
- `bela_card_last4`
- `bela_card_brand`
