# Pantry And Meal Plan — Meal Plan Generation

## What This File Covers

Personal 7-day meal plan generation.

## Source Specs

- `brioela-specs/33-minimum-spend-meal-plan.md`

## User Outcome

User asks:

```text
Plan my week.
```

Brioela returns a 7-day plan using what the user already has where possible.

## Generation Inputs

- inventory snapshot from Orchestrator DO
- recent receipt history
- recipe pool
- active constraints
- budget baseline
- waste-risk ingredients

## Generation Rules

- single structured LLM call
- target under 5 seconds
- stored in Orchestrator DO SQLite
- no external query during generation
- no repeated recipe type within 3 consecutive days
- avoid main protein repetition on back-to-back days

## Data Model

- `meal_plan`
- `meal_plan_slot`
- `meal_plan_shopping_list`

## Tier Rule

Full 7-day plan is Core tier and above. Free users may see a single-day preview.
