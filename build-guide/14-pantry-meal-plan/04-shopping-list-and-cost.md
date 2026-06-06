# Pantry And Meal Plan — Shopping List And Cost

## What This File Covers

Shopping list delta, estimated costs, and store suggestions.

## Source Specs

- `brioela-specs/33-minimum-spend-meal-plan.md`
- `build-guide/13-receipt-intelligence/05-price-history-and-alerts.md`
- `build-guide/10-map/05-price-alerts.md`

## Shopping List Delta

Compare meal plan ingredients against estimated inventory.

Output:

- already have
- to buy
- bought

## Sorting

Sort to-buy items by store department:

- produce
- dairy
- meat
- pantry
- frozen
- other

## Cost Estimate

Use receipt-derived personal price history first.

Use shared anonymized map price data only when personal history is absent.

## Store Suggestion

If multiple list items are cheaper at a nearby store, show one concise suggestion.

## Rule

Cheaper suggestions must pass constraints before surfacing.
