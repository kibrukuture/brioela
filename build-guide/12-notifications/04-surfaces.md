# Notifications — Surfaces

## What This File Covers

Where Brioela surfaces moments: push, in-app, map, scan result, cooking/session UI.

## Source Specs

- `brioela-specs/23-ambient-notification-strategy.md`
- `build-guide/09-ground/05-haptic-walking-discovery.md`
- `build-guide/11-bela/15-checkout-payment.md`

## Push

Use only for moments worth interrupting.

Examples:

- critical safety
- recall
- high-value timed event
- delivery confirmation window

## In-App Ambient Surface

Use for lower urgency.

Examples:

- Ground find below scan result
- map opens pre-filtered
- weekly summary on app open
- pattern insight card

## Haptic Surface

Ground walking discovery uses a haptic pulse, not push.

## Session Surface

Cooking/Bela active sessions should queue or inline non-critical moments.

Do not interrupt active voice/cooking unless critical.
