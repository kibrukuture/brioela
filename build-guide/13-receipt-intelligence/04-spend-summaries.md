# Receipt Intelligence — Spend Summaries

## What This File Covers

Weekly/category spend summaries and health-oriented spend aggregation.

## Source Specs

- `brioela-specs/06-receipt-spend-intelligence.md`

## Summary Table

`spend_summary` fields:

- `user_id`
- `week_start`
- `healthy_spend`
- `non_healthy_spend`
- `uncategorized_spend`

## Categories

Spend category depends on matched product and rule-based health score.

Unmatched lines stay uncategorized.

## Computation

Run summary computation on schedule, not on every receipt view.

Use Brain alarm cycle for private user summaries.

## Boundary

This feature computes summaries. Weekly summary presentation belongs to ambient intelligence / notifications.
