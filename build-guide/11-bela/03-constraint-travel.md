# Bela — Constraint Travel

## What This File Covers

How user/recipient constraints travel with an order and enforce on the shopper scanner.

## Sources

- `implementable-specs/bela/03-constraint-travel.md`
- `implementable-specs/06-constraints.md`
- `build-guide/07-scanner/03-constraint-check.md`

## Core Rule

The shopper never sees the full private profile. The shopper only sees per-product enforcement.

## Snapshot Timing

Create `order_constraint_snapshot` when order enters `pending`.

BelaOrderAgent loads the frozen snapshot when shopper accepts.

## Snapshot Contents

- hard blocks
- soft guidance
- captured timestamp
- order ID

## Enforcement

- hard allergy: block
- confirmed boycott: block
- dietary identity: block/warn according to source constraint
- intolerance: product decision required; do not assume scanner warning behavior blindly
- dislike/preference: soft guidance

## Override

Shopper cannot override hard blocks.

Only the user can override, and it must be logged.
