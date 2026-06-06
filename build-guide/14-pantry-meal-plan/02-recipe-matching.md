# Pantry And Meal Plan — Recipe Matching

## What This File Covers

Ranking recipes against available pantry ingredients.

## Source Specs

- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`
- `brioela-specs/33-minimum-spend-meal-plan.md`
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`

## Data Model

### `pantry_recipe_match`

- `snapshot_id`
- `recipe_id`
- `coverage_score`
- `substitution_score`

## Ranking Inputs

- ingredient coverage
- required substitutions
- allergies/dislikes/constraints
- estimated cost of missing ingredients
- time to cook
- prior recipe success/like signals

## Recipe Pool Priority

1. User saved recipes.
2. User cooked successfully before.
3. Constraint-compatible shared recipes later.
4. Generated recipes from available ingredients.

## Rule

Recipes must clear hard constraints before ranking.
