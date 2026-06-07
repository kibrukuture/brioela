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

Before launch, re-check current Gemini Live / Cloudflare Realtime / RealtimeKit costs.

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

```text
Mesa
+$8/month
Included in Viva
For everyone at your table.
Up to 8 active Mesa members.
```

Mesa can be added to Luma or Culina. Viva includes Mesa.

Rules:

- no per-member fee within 8 active members
- archived members do not count toward limit
- invited contributor accounts do not automatically increase member limit
- larger Mesa needs a later support/custom policy, not hidden per-seat billing

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
