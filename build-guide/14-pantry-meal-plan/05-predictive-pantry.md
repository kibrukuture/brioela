# Pantry And Meal Plan — Predictive Pantry

## What This File Covers

Predicting when the user will need regularly purchased items.

## Source Specs

- `brioela-specs/36-predictive-pantry-intelligence.md`

## Core Rule

Do not maintain exact real-time inventory.

Predict when the user likely needs to buy again.

## Algorithm

For each regularly purchased item:

1. Compute median days between purchases.
2. Find last purchased/scanned date.
3. Predict depletion date.
4. Surface if within threshold.

Minimum data:

- 3 purchase events for medium confidence
- 5+ purchase events for high confidence

## Data Model

### `purchase_pattern`

- `item_key`
- `display_name`
- `purchase_dates`
- `median_interval_days`
- `last_purchased`
- `confidence_tier`
- `dismissed`

### `predictive_nudge`

- `nudge_id`
- `item_key`
- `predicted_need_date`
- `surfaced_at`
- `resolved_at`
- `outcome`

## Notification Behavior

- high confidence: quiet notification + auto-add to list
- medium confidence: list only
- low confidence: only if user opens shopping list
