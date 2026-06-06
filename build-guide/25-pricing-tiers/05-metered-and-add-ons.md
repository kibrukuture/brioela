# Pricing Tiers — Metered And Add-Ons

## What This File Covers

Session credits, Mesa add-on options, Bela/service fees, and Signet pricing boundaries.

---

## Metered Credits

Spec baseline:

- voice session: `$0.25/session`, up to 15 minutes
- vision session: `$1.00/session`, up to 30 minutes
- multi-person room: `$0.50/session`, up to 4 participants, 45 minutes
- credits do not expire

Before launch, re-check current Gemini Live / Cloudflare Realtime costs. The spec cost table references older LiveKit assumptions in places, while the current build-guide uses Cloudflare Realtime.

---

## Credit Rules

```typescript
type SessionCreditBalance = {
  userId: string
  voiceCredits: number
  visionCredits: number
  roomCredits: number
  updatedAt: number
}
```

Rules:

- credits never expire
- show estimated credit use before starting paid session
- do not consume credit if session fails before meaningful use
- refund/restore credit on backend failure
- meter by session type, not hidden token math

---

## Mesa Add-On

Mesa is not final.

Options:

1. Included in Viva.
2. Add-on to Luma/Culina/Viva.
3. Member-count-based add-on.
4. Separate Mesa plan later.

Recommendation for now:

```text
Mesa
For everyone at your table.
Pricing to be decided before implementation.
```

Do not hardcode Mesa pricing until account model and invite permissions are decided.

---

## Bela

Bela should not be forced into subscription tiers yet.

Likely model:

- service fee per order
- shopper/delivery fee
- optional standing order convenience fee
- tier benefits later if needed

Bela must still respect user/Mesa constraints regardless of subscription.

---

## Signet

Signet starts from `$99/month`.

It can support:

- verified_profile
- verified_business
- practitioner client tools
- verified map listing
- creator/chef recipe attribution
- privacy-safe analytics

Open decisions:

- one price for people and businesses, or subtype pricing?
- client-seat pricing after 10 clients?
- analytics add-on?
- verified business location count pricing?

Keep pricing flexible until Verified Profiles implementation starts.
