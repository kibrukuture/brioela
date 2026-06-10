# Craving Decoder — The System Skill

## What This File Covers

The `craving-decoder` system skill definition and triggering.

## Source Specs

- `brioela-specs/52-craving-decoder.md`
- `brioela-specs/09-per-user-brain.md` (skills model)

## Seeding

- Name: `craving-decoder`. `source = 'system'`, seeded at DO initialization in code, never created at runtime, never touched by Brain maintenance.
- Index description (the one line the model sees): "Evidence-based analysis when the user asks why they are craving something."
- Loaded via `skill_view` through the standard index-then-load path. No new routing, no keyword triggers in code — the model recognizes craving-shaped requests from the index.

## Triggers (defined in the skill content)

- explicit voiced craving questions ("why do I want chocolate so badly?")
- craving-shaped scan questions
- craving-context scans (late-night repeat scans of comfort categories — the spec 17 signature) **where the user is engaging the scan screen**

Never proactive. This skill answers; it does not approach.

## Language Rules (skill content)

- every claim sourced in plain words: "your ring says", "nothing's been logged since 9am", "the last four times"
- observations, never verdicts: "this is when you usually reach for sugar", never "you shouldn't"
- two or three sentences of answer, then one optional offer, then silence
- the honest no: "No pattern I can see — sometimes chocolate is just chocolate."

## Rule

The skill is maintained in code and reseeded on change (system-skill rule). Improvements come from deploys, not runtime self-edits.
