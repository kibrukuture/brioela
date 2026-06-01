# 17. Behavioral Food Pattern Detection

## Goal
Detect food-related behavior patterns over time and surface useful interventions only when the confidence and usefulness are high enough.

## Example Behaviors
- Stress eating patterns.
- Repeated post-sickness associations.
- Ingredient or brand aversion based on repeated rejection.
- Travel-related food preparation needs.

## User Outcome
- Brioela notices patterns without demanding manual tracking.
- User sees timely, narrow, practical interventions.

## In Scope
- Event-sequence analysis.
- Pattern confidence scoring.
- Low-frequency intervention generation.

## Out of Scope
- Mental health diagnosis.
- Medical or psychiatric claims.

## Inputs
- Time-of-day scan behavior.
- Purchase repetition.
- Recipe completion rates.
- Voice and note signals.
- User-confirmed negative outcomes.

## Data Model
- `behavior_pattern`: user_id, pattern_type, evidence_json, confidence, first_seen_at, last_seen_at.
- `pattern_intervention`: user_id, pattern_id, intervention_type, created_at, acted_on_at.

## Technical Notes
- Pattern generation should use explicit thresholds and evidence storage.
- Interventions must be sparse to avoid feeling invasive.
- Sensitive patterns should require higher confidence than shopping patterns.

## Success Metrics
- Intervention acceptance rate.
- Dismissal rate.
- Repeat engagement after intervention.
