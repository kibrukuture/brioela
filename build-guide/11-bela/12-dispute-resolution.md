# Bela — Dispute Resolution

## What This File Covers

Dispute types, evidence, timing, refunds, and health-incident handling.

## Sources

- `implementable-specs/bela/12-dispute-resolution.md`

## Window

User has 30 minutes after confirmation or auto-confirm to dispute.

## Types

- wrong item
- missing item
- constraint violation
- damaged/spoiled item

## Evidence

- scan log
- order items
- constraint snapshot
- store receipt scan
- door receipt scan
- delivery photo
- user dispute photo

## Constraint Violation

Treat as health incident:

- refund if confirmed
- suspend shopper pending review
- escalate product data if matching/database caused failure

## Refund Rule

Refund to original payment method, not wallet.
