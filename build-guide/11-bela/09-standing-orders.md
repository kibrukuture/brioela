# Bela — Standing Orders

## What This File Covers

Recurring pantry replenishment.

## Sources

- `implementable-specs/bela/09-standing-order.md`

## Frequency

- weekly
- biweekly
- monthly

## Flow

1. AI proposes cycle.
2. User has approval window.
3. User can edit/skip/confirm.
4. Auto-confirm can be enabled.
5. Order enters normal Bela flow.

## Payment Rule

Use normal PaymentIntent manual capture flow.

Ignore stale wallet references in source spec.
