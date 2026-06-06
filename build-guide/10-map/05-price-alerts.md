# Map — Price And Availability Alerts

## What This File Covers

Hyperlocal price sightings, alert candidate generation, and throttled delivery.

## Source Specs

- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`
- `brioela-specs/06-receipt-spend-intelligence.md`
- `build-guide/13-receipt-intelligence/00-overview.md`

## Data

Price data comes from:

- receipt parsing
- user-submitted price sightings
- Ground price Finds
- merchant feeds later

## Alert Conditions

An alert candidate can be created when:

- user has prior interest in product/category
- price delta crosses threshold
- availability signal is recent
- place is close enough to act on
- suppression rules allow it

Spec thresholds:

- greater than 15% increase vs 90-day average = significant increase
- greater than 10% decrease = positive stock-up signal

## API Surface

- `POST /api/map/price-sightings`
- `POST /api/alerts/evaluate`

## Delivery Boundary

This file only defines candidate generation and map linkage.

Notification delivery belongs to `12-notifications` / ambient intelligence.
