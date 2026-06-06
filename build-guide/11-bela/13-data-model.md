# Bela — Data Model

## What This File Covers

Canonical Bela data model after resolving stale wallet/Issuing conflicts.

## Sources

- `implementable-specs/bela/13-data-model.md`
- `implementable-specs/bela/15-checkout-payment.md`

## Supabase Tables

- `shoppers`
- `orders`
- `order_items`
- `order_events`
- `order_constraint_snapshot`
- `standing_orders`
- `standing_order_cycles`
- `disputes`
- `shopper_scan_log`
- `family_links`
- `order_payment_events`
- `order_receipt_scans`

## Removed/Stale

- `wallet_transactions` should not be used for final Bela.
- user wallet cache should not be used for final Bela.

## Required Shopper Card Fields

- `bela_card_payment_method_id`
- `bela_card_last4`
- `bela_card_brand`

## OrderAgent DO State

OrderAgent owns live order state, WebSocket clients, scan relay, shopper AI session, and constraint snapshot cache.

Supabase remains durable source of truth.

## R2

R2 stores:

- receipt images
- delivery photos
- dispute photos
