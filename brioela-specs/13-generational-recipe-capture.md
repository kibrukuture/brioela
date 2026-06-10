# 13. Generational Recipe Capture

## Goal
Turn live family cooking sessions into reusable, structured recipes even when the source cook does not provide formal measurements or step sequencing.

## User Outcome
- Cook with a parent or grandparent.
- Let Brioela observe, listen, and reconstruct the recipe.
- Save the recipe permanently into the user's library and memory.

## In Scope
- Live transcript capture.
- Visual observation during cooking.
- Ingredient and step reconstruction.
- Draft recipe review after session.

## Out of Scope
- Fully automatic publishing.
- Exact scientific nutrition labeling.

## Reconstruction Strategy
- Combine transcript, ingredient mentions, visual objects, and timeline order.
- Infer approximate quantities when exact ones are absent.
- Mark uncertain fields instead of fabricating confidence.

## Data Model
- `heritage_recipe_capture`: capture_id, owner_user_id, room_id, status, created_at.
- `heritage_recipe_draft`: capture_id, title, ingredients_json, steps_json, confidence.

## Review Workflow
- End session.
- Generate draft recipe.
- Highlight uncertain ingredients or amounts.
- Save into user recipe library.

## Technical Constraints
- Session artifacts should be summarized quickly while context is fresh.
- Draft generation should preserve source traceability for later editing.

## Naming — Part of the Heirloom Family

This feature is the capture half of **Heirloom** (spec 48), the umbrella name for Brioela's heritage family: this spec captures an Heirloom recipe, spec 32 extracts the cook's Heirloom style profile, and spec 48 bundles and passes the Heirloom on to family. User-facing language across all three uses Heirloom ("Heirloom recipes", "her Heirloom"). The internal table names in this spec (`heritage_recipe_capture`, `heritage_recipe_draft`) predate the name and remain valid.

## Success Metrics
- Number of captured recipes finalized.
- Number of uncertain fields per finalized recipe.
- Re-cook rate of captured heritage recipes.
