# Bela — Order Creation

## What This File Covers

How a Bela order is created, estimated, approved, and moved into `pending`.

## Sources

- `implementable-specs/bela/00-overview.md`
- `implementable-specs/bela/01-order-creation.md`

## Order Sources

- direct user order
- pantry gap order
- standing order
- cooking intent
- recipe save
- order for another person

## Flow

1. User gives intent or approves AI-generated list.
2. Brioela creates draft items.
3. User approves/edit items and delivery window.
4. Price estimate is created.
5. Order enters `pending`.
6. Shoppers are notified.

## Key Rule

No payment authorization until a shopper accepts.

## State

Initial status: `pending`.

Order source fields:

- `source_kind`
- `source_ref`
