# Encore — Share Card and Records

## What This File Covers

The first-cook share moment and the data model.

## Source Specs

- `brioela-specs/44-encore.md`
- `brioela-specs/25-viral-growth-and-sharing.md`

## Share Card

- Offered once, after the first completed cook. Never automatic.
- Content: original plate photo beside the home-cooked result, dish name, "tasted in [city], cooked at home with Brioela."
- Location precision: city level, never finer. No place name unless the user adds it.
- Static image artifact, EXIF stripped.

## Data Model (Brain DO SQLite)

```sql
encore (
  encore_id, user_id, recipe_id, origin_place_id nullable,
  origin_city, captured_at,
  status check(status in ('reconstructing','draft','refining','stable')),
  photo_refs_discarded boolean  -- always true after processing
)

encore_open_question (
  question_id, encore_id, component, question_text,
  resolved boolean, resolution_note, resolved_in_session_id
)

encore_refinement (
  refinement_id, encore_id, session_id, field_changed,
  old_value, new_value, evidence, created_at
)
```

## Discard Rules

- Plate photos: discarded after the visual analysis step.
- Voice note audio: discarded after transcription.
- Only derived reconstruction data persists. Same no-raw-media rule as vision sessions and visual intake.

## Metrics To Instrument

capture-to-draft completion, first-cook rate (30 days), refinement convergence (cooks until stable), Bela conversion from sourcing, share rate after first cook, Chef conversion at the preview gate.
