# Notifications — Suppression State

## What This File Covers

Dismissal-based suppression and where state lives.

## Source Specs

- `brioela-specs/23-ambient-notification-strategy.md`
- `build-guide/05-orchestrator/05-alarm-system.md`

## Storage

Suppression state lives in the Orchestrator DO per user.

## Rules

- two dismissals of same notification type: suppress for 14 days
- three dismissals of same notification type: permanent suppress until user re-enables

## Applies To

- medium priority
- high priority where safe
- in-app ambient cards when dismissal means “not interested”

## Does Not Apply To

- critical allergy/safety alerts
- confirmed dangerous recall alerts

## Required State

- notification type
- dismissed count
- last dismissed timestamp
- suppressed until
- permanent flag
