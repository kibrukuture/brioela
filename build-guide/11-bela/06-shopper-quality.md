# Bela — Shopper Quality

## What This File Covers

Shopper scoring, trust relationship, and suspension triggers.

## Sources

- `implementable-specs/bela/06-shopper-quality.md`

## Score Weights

- 40% constraint compliance
- 30% item accuracy
- 20% delivery accuracy
- 10% user satisfaction

## Trust Relationship

Created after repeated successful orders between same user and shopper.

Requires:

- 3+ orders
- no disputes
- no constraint violations

## Suspension Triggers

- confirmed constraint violation
- repeated wrong items
- receipt mismatch
- delivery fraud
- low quality score threshold
