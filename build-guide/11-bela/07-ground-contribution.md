# Bela — Ground Contribution

## What This File Covers

How shopper activity can create Ground drafts without leaking private order data.

## Sources

- `implementable-specs/bela/07-ground-contribution.md`
- `build-guide/09-ground/`

## Rule

Shopper Ground contribution is opt-in.

## Draft Types

- price signal
- availability signal
- new product
- freshness signal

## Privacy Blocks

Never include:

- user identity
- shopper identity
- order identity
- private constraints
- blocked products from user profile

## Gate

All drafts pass the same Ground authenticity gate.
