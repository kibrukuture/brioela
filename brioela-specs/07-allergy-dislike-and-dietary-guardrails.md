# 07. Allergy, Dislike, And Dietary Guardrails

## Goal
Maintain hard and soft food constraints for a user and enforce them consistently across scanning, recipes, map discovery, and cooking guidance.

## Constraint Types
- Hard allergy: never allow silent recommendation when matched.
- Strong avoidance: avoid suggesting unless explicitly overridden.
- Soft dislike: deprioritize but do not hard-block.
- Dietary identity: persistent filter such as vegan, halal, keto, low sodium.

## User Outcome
- Set or confirm a constraint once.
- Have Brioela remember and enforce it everywhere.

## Data Model
- `food_constraint`: user_id, type, value, severity, source, created_at.
- `constraint_match`: user_id, object_type, object_id, matched_value, matched_at.

## Inputs
- Direct user declaration.
- Behavioral inference proposals.
- Product ingredients.
- Recipe ingredients.
- Restaurant suitability metadata.

## Enforcement Rules
- Hard allergy matches must interrupt normal scan flow and present an explicit warning.
- Soft dislikes only affect ranking.
- Dietary identity affects search, map, and recipe retrieval before final ranking.

## API Surface
- `POST /api/user/constraints`
- `GET /api/user/constraints`
- `POST /api/user/constraints/suggest`

## Technical Notes
- Constraint matching requires ingredient synonym resolution.
- Trace ingredient detection must support nested ingredient lists.
- Constraint source should be preserved to distinguish explicit user input from inferred data.

## Success Metrics
- Constraint match accuracy.
- Number of prevented bad recommendations.
- Acceptance rate of inferred constraint suggestions.
