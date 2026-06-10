# Heirloom — DO-to-DO Delivery

## What This File Covers

The copy-on-accept transfer mechanics.

## Source Specs

- `brioela-specs/48-heirloom.md`
- `brioela-specs/12-multi-person-cooking-rooms.md` (copy-per-participant precedent)

## Transfer Flow

1. Acceptance validated (invitation status, hash match).
2. Owner's Brain DO assembles the payload: Heirloom metadata + items at the invitation's version (recipes in spec 02/13 schema, style profile in spec 32 shape, moments with photo refs).
3. A Worker broker route relays the payload to the recipient's Brain DO. The broker holds it transiently — nothing persisted outside the two DOs.
4. Recipient's Brain ingests through standard write paths: recipes via the recipe tables, style profile via the spec 32 tables, Heirloom + items rows with role `recipient` and `received_from` set.
5. Photos copied into recipient-scoped R2 objects; refs rewritten. The recipient never depends on the owner's objects.
6. Invitation marked accepted; owner notified once (high-priority in-app, push per notification rules).

## Versioning and Push-Forward

- Append-only versions. A push creates version N+1; prior recipients are offered the delta with an accept prompt. Nothing lands silently.
- No retroactive removal propagates — copies are copies. The owner removing an item affects future versions only.

## Failure Handling

Each step idempotent and resumable (Upstash Workflow): a transfer interrupted mid-photo-copy resumes; a double-accept is a no-op. The recipient either has a complete Heirloom version or none — no partial states surface.

## Rule

After delivery, the two Heirlooms are independent objects. No sync, no shared state, no later reconciliation. By design, forever.
