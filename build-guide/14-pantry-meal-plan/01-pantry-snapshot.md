# Pantry And Meal Plan — Pantry Snapshot

## What This File Covers

Fridge/pantry camera snapshot and detected ingredient state.

## Source Specs

- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`

## Core Rule

Operate on snapshots, not continuous inventory.

## Data Model

### `pantry_snapshot`

- `snapshot_id`
- `user_id`
- `created_at`
- `source_type`

### `pantry_item_detection`

- `snapshot_id`
- `item_label`
- `confidence`
- `quantity_estimate`

## Sources

- fridge/pantry camera image
- recent scans
- receipt history
- recipe usage history

## UX Rule

Detection confidence is hidden from primary UX. Show only in expanded/debug review.
