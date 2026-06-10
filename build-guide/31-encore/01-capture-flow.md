# Encore — Capture Flow

## What This File Covers

The capture moment and its intent boundary.

## Source Specs

- `brioela-specs/44-encore.md`
- `brioela-specs/34-universal-visual-intake.md` (intent boundary)

## The Action

One explicit action: photograph the plate via the recreate flow ("I want this forever" voice trigger or the recreate button on a fresh photo).

- Photo: required. Multiple angles accepted, never demanded.
- Voice note: optional. Transcribed client-side path → transcript attached; audio discarded immediately (same rule as Ground voice-to-find).
- Context, gathered automatically, zero questions:
  - place identity from location (places database)
  - same-visit menu scan text if one exists (strongest signal)
  - user cuisine priors from scan/recipe history
  - meal context (time of day, other photos this meal)

## Intent Boundary

- Passive meal photo via universal visual intake → memory log only. Never triggers reconstruction.
- Recreate action → reconstruction + the normal meal-log memory write as a side effect.
- Two UI actions, two code paths. No crossover.

## API

`POST /api/encores` — returns `encore_id` immediately; workflow starts async. Acknowledgment copy: "Working on it — I'll have a recipe shortly."

## Rule

Free/Core users: capture always succeeds and is stored. The gate (Chef) applies to the draft view, never to the capture.
