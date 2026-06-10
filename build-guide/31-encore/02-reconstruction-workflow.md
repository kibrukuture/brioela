# Encore — Reconstruction Workflow

## What This File Covers

The async reconstruction pipeline.

## Source Specs

- `brioela-specs/44-encore.md`

## The Workflow (Upstash Workflow, five steps)

1. **Visual analysis** — GPT-4o mini vision extraction over the plate photo(s): visible components, evident cooking methods (sear marks, braise sheen, char, emulsification), garnishes, portion structure. Zod-enforced structured output.
2. **Context fusion** — merge menu text (if any), voice-note transcript, place cuisine type, user cuisine priors.
3. **Recipe reconstruction** — one structured LLM call producing the spec 02 `user_recipe` shape with per-field confidence. Unresolvable components become named open questions ("an unidentified green sauce — likely herb-based").
4. **Constraint adaptation** — run the draft through the full constraint profile (allergies, dietary identity, medical conditions). Every substitution annotated and attributed.
5. **Sourcing check** — per-ingredient status: `have` (pantry inference) / `nearby` (Ground or map sighting) / `hard-to-find` (closest known source + `ingredient_not_found` memory event).

## Targets

- Draft available: under 30 seconds from submission.
- Each step retries independently (Workflow semantics). A failed sourcing step never blocks the draft — recipe ships, sourcing fills in late.

## Delivery

Draft arrives as a high-priority in-app surface; push only if the user left the app (notification rules from `12-notifications`).

## Rule

Never fabricate certainty. `estimated` markers and open questions are first-class output, not failure states.
