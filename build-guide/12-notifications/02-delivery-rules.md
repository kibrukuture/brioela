# Notifications — Delivery Rules

## What This File Covers

When notifications can be delivered or delayed.

## Source Specs

- `brioela-specs/23-ambient-notification-strategy.md`

## Daily Cap

- medium push: max one per day
- critical push: unlimited

## Quiet Hours

No push between 11pm and 7am local time except critical safety alerts.

## Active Sessions

No non-critical push during:

- voice sessions
- cooking sessions
- active shopping/live scan sessions

Queue non-critical notifications and surface after session ends.

## Geo Timing

Map/location notifications only deliver when:

- user is near relevant location
- timing is reasonable
- category is not suppressed
- signal is still fresh

## One Thing Rule

Each push contains:

- one piece of information
- one optional action

No compound messages.
