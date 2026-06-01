# 15. Hyperlocal Price And Availability Alerts

## Goal
Notify users when frequently purchased or preferred products are available nearby at a better price or after a recent sighting.

## User Outcome
- Brioela notices a relevant local opportunity.
- User receives a low-noise, high-utility alert.
- User can open the map directly into the nearby store or place.

## In Scope
- Price sightings.
- Availability sightings.
- User preference matching.
- Alert throttling.

## Out of Scope
- Full retailer integrations at launch.
- Promotional ad placement.

## Data Model
- `price_sighting`: product_id, place_id, amount, currency, seen_at, reporter_user_id.
- `alert_candidate`: user_id, product_id, place_id, score, generated_at.
- `delivered_alert`: user_id, alert_type, object_id, delivered_at.

## Alert Logic
- User must have prior interest signal for the product or category.
- Price delta must cross a configurable threshold.
- Availability confidence must be recent.
- Alert suppression should prevent spam.

## API Surface
- `POST /api/map/price-sightings`
- `POST /api/alerts/evaluate`

## Success Metrics
- Alert open rate.
- Alert-to-map conversion rate.
- Repeat contribution rate for sightings.
