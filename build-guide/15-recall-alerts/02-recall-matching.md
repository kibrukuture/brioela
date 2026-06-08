# Recall Alerts — Recall Matching

## What This File Covers

Matching recall entries against user scan history.

## Source Specs

- `brioela-specs/26-personalized-recall-alerts.md`
- `build-guide/07-scanner/00-overview.md`

## Match Inputs

From recall:

- UPC
- brand
- product name
- lot numbers
- affected date range
- source region

From scan history:

- scan event product identifiers
- scan timestamp
- user ID
- lot number if captured

## Matching Flow

1. Extract identifiers from recall.
2. Query shared scan events in Supabase for product matches.
3. Check timestamp against affected date range.
4. If lot matches, create confirmed match.
5. If all lots are recalled or lot unknown, create probable match for scans in last 90 days.
6. Route match to user Brain DO for notification delivery.

## Match Confidence

- `confirmed`: UPC/product and lot/date match.
- `probable`: broad recall or missing lot.
- `informational`: product scanned but lot clearly does not match.

## Efficiency Rule

One query per recall entry against indexed scan history.

Never one query per user.
