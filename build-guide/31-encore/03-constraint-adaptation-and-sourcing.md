# Encore — Constraint Adaptation and Sourcing

## What This File Covers

Adaptation attribution and the sourcing handoffs.

## Source Specs

- `brioela-specs/44-encore.md`
- `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md`
- `brioela-specs/28-medical-condition-food-profile.md`

## Adaptation Rules

- Hard allergens: substituted, substitution annotated "swapped for your allergy." Never silently dropped, never silently kept.
- Medical conditions: spec 28 rules applied with attribution ("reduced for your condition").
- Soft dislikes: substitution offered, original preserved as the noted authentic version.
- Style profile crossover: "cook in [name]'s style" reuses the spec 32 adaptation call unchanged — no new mechanism.

## Sourcing Statuses

| Status | Source | UI behavior |
|---|---|---|
| have | pantry inference (receipts + scans) | shown green, struck from buy list |
| nearby | Ground find or map product sighting | links to the find/place |
| hard-to-find | no recent local signal | closest known source + ingredient_not_found event |

## Handoffs

- "Get what's missing" → Bela order pre-filled with missing ingredients; standard order creation; constraint profile travels as always.
- `ingredient_not_found` memory events arm the find-to-cooking trigger (35b Angle 4): a future Ground find for that ingredient surfaces the recreation automatically.

## Rule

A suggested substitute must clear the full constraint profile. A cheaper or easier alternative containing a known allergen is never surfaced.
