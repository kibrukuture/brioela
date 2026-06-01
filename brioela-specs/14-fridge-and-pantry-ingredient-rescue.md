# 14. Fridge And Pantry Ingredient Rescue

## Goal
Infer what a user can cook from currently available ingredients by using camera input and pantry context instead of manual inventory entry.

## User Outcome
- Point the camera into a fridge or pantry.
- Receive candidate meals ranked by fit, health, and likely success.
- Avoid waste and reduce decision friction.

## In Scope
- Ingredient detection from camera frames.
- Pantry-state snapshot generation.
- Recipe ranking against available ingredients.
- User-specific filtering from food memory.

## Out of Scope
- Full perpetual inventory tracking.
- Retail checkout integration.

## Data Model
- `pantry_snapshot`: snapshot_id, user_id, created_at, source_type.
- `pantry_item_detection`: snapshot_id, item_label, confidence, quantity_estimate.
- `pantry_recipe_match`: snapshot_id, recipe_id, coverage_score, substitution_score.

## Ranking Inputs
- Ingredient coverage.
- Number of required substitutions.
- User dislikes or allergies.
- Estimated cost of missing ingredients.
- Time to cook.

## Technical Notes
- This feature should operate on snapshots, not continuous live inventory.
- Detection confidence should be visible only in debug or expanded review, not primary UX.

## Success Metrics
- Number of pantry snapshots created.
- Recipe clickthrough after snapshot.
- Reduction in missing-ingredient recipe abandonment.
