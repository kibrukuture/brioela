# Recall Alerts — Data Model

## What This File Covers

Recall tables and processing state.

## Source Specs

- `brioela-specs/26-personalized-recall-alerts.md`

## Shared Supabase Tables

### `recall_entry`

Fields:

- `recall_id`
- `source`
- `product_name`
- `upc`
- `lot_numbers_json`
- `reason`
- `issued_at`
- `expires_at`
- `raw_notice_url`
- `status`
- `raw_payload_json`

### `recall_scan_match`

Fields:

- `match_id`
- `recall_id`
- `user_id`
- `scan_event_id`
- `match_confidence`
- `notified_at`
- `resolved_at`

## Indexes Required

- recall source + issued date
- recall UPC
- scan event UPC/product identifiers
- scan event user ID
- recall match user ID

## Orchestrator Boundary

Recall entries and matches are shared processing data.

Notification/suppression/device token handling belongs to the user's Orchestrator DO.
