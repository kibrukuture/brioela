# Illness Detective — Community Signal

## What This File Covers

Anonymized illness clustering and Ground alert handoff.

## Source Specs

- `brioela-specs/30-food-illness-detective.md`
- `build-guide/09-ground/`

## Trigger

If user confirms others got sick from same product/place, log anonymized illness signal.

## Shared Table

### `community_illness_signal`

- `signal_id`
- `product_id` or `restaurant_id`
- `signal_count`
- `window_start`
- `window_end`
- `elevated`
- `created_at`

## Privacy

- no user ID
- no exact timestamp
- no personal profile
- no sub-24-hour precision

## Elevation Rule

3+ independent reports within 72 hours can elevate to a Ground/community alert.

## Authority Sharing

User opt-in is required before sharing any illness data with food safety authorities.
